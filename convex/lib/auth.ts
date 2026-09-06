import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

export async function getIdentityOrThrow(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error('Nicht angemeldet');
	}
	return identity;
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
	const identity = await getIdentityOrThrow(ctx);
	const user = await ctx.db
		.query('users')
		.withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
		.unique();
	if (!user) {
		throw new Error('Benutzer nicht gefunden. Bitte Seite neu laden.');
	}
	return user;
}

export async function getCurrentUserOrNull(
	ctx: QueryCtx | MutationCtx
): Promise<Doc<'users'> | null> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;
	return await ctx.db
		.query('users')
		.withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
		.unique();
}

export async function requireOnboardedUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
	const user = await getCurrentUser(ctx);
	if (!user.onboardingCompleted) {
		throw new Error('Onboarding muss zuerst abgeschlossen werden');
	}
	return user;
}

export function isAdminEmail(email: string): boolean {
	const raw = process.env.ADMIN_EMAILS ?? '';
	const allowed = raw
		.split(',')
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
	return allowed.includes(email.toLowerCase());
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
	const user = await getCurrentUser(ctx);
	if (!user.isAdmin && !isAdminEmail(user.email)) {
		throw new Error('Admin-Zugang erforderlich');
	}
	return user;
}

export async function getMembership(
	ctx: QueryCtx | MutationCtx,
	organizationId: Id<'organizations'>,
	userId: Id<'users'>
) {
	return await ctx.db
		.query('memberships')
		.withIndex('by_org_and_user', (q) =>
			q.eq('organizationId', organizationId).eq('userId', userId)
		)
		.unique();
}

export async function requireOrgMember(
	ctx: QueryCtx | MutationCtx,
	organizationId: Id<'organizations'>,
	userId: Id<'users'>
) {
	const membership = await getMembership(ctx, organizationId, userId);
	if (!membership) {
		throw new Error('Kein Mitglied dieser Organisation');
	}
	return membership;
}

export async function requireOrgBooker(
	ctx: QueryCtx | MutationCtx,
	organizationId: Id<'organizations'>,
	userId: Id<'users'>
) {
	const membership = await requireOrgMember(ctx, organizationId, userId);
	if (membership.role === 'viewer') {
		throw new Error('Keine Buchungsberechtigung');
	}
	return membership;
}

export async function getActiveRosterForDj(
	ctx: QueryCtx | MutationCtx,
	djProfileId: Id<'djProfiles'>
) {
	const entries = await ctx.db
		.query('rosterEntries')
		.withIndex('by_dj', (q) => q.eq('djProfileId', djProfileId))
		.take(20);
	return entries.find((entry) => entry.status === 'active') ?? null;
}

export async function notify(
	ctx: MutationCtx,
	userId: Id<'users'>,
	title: string,
	body: string,
	href?: string
) {
	await ctx.db.insert('notifications', {
		userId,
		title,
		body,
		href,
		read: false,
		createdAt: Date.now()
	});
	await ctx.scheduler.runAfter(0, internal.push.sendToUser, {
		userId,
		title,
		body,
		href
	});
}
