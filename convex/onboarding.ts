import type { Infer } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { authedMutation, authedQuery } from './lib/customFunctions';
import { encodeGeohash, slugify } from './lib/geo';
import {
	onboardingDetailsInput,
	onboardingFinalizeResult,
	onboardingProfileInput,
	onboardingRole,
	publicOnboardingState
} from './lib/validators';

type OnboardingRole = Infer<typeof onboardingRole>;
type OnboardingDetails = Infer<typeof onboardingDetailsInput>;
type Draft = Doc<'onboardingDrafts'>;
type CompleteDraft = Draft & {
	name: string;
	bio: string;
	city: string;
	country: string;
};

const stepOrder = {
	role: 0,
	profile: 1,
	details: 2,
	review: 3,
	complete: 4
} as const;

function toPublicState(draft: Draft | null, completed: boolean) {
	if (!draft) {
		return {
			role: null,
			step: completed ? ('complete' as const) : ('role' as const)
		};
	}
	return {
		role: draft.role,
		step: draft.step,
		name: draft.name,
		bio: draft.bio,
		city: draft.city,
		country: draft.country,
		lat: draft.lat,
		lng: draft.lng,
		website: draft.website,
		instagram: draft.instagram,
		genres: draft.genres,
		feeMin: draft.feeMin,
		feeMax: draft.feeMax,
		currency: draft.currency,
		soundcloud: draft.soundcloud,
		mixUrl: draft.mixUrl,
		address: draft.address,
		capacity: draft.capacity
	};
}

async function getDraft(
	ctx: { db: MutationCtx['db'] },
	userId: Id<'users'>
): Promise<Draft | null> {
	return await ctx.db
		.query('onboardingDrafts')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.unique();
}

function assertCanEdit(user: Doc<'users'>, draft: Draft | null): asserts draft is Draft {
	if (user.onboardingCompleted || draft?.step === 'complete') {
		throw new Error('Onboarding ist bereits abgeschlossen');
	}
	if (!draft) {
		throw new Error('Bitte zuerst eine Rolle auswählen');
	}
}

function assertStepReached(draft: Draft, required: keyof typeof stepOrder) {
	if (stepOrder[draft.step] < stepOrder[required]) {
		throw new Error(`Schritt ${required} ist noch nicht freigeschaltet`);
	}
}

function nextUnlockedStep(current: Draft['step'], next: Draft['step']): Draft['step'] {
	return stepOrder[current] >= stepOrder[next] ? current : next;
}

function cleanOptional(value: string | undefined): string | undefined {
	const cleaned = value?.trim();
	return cleaned ? cleaned : undefined;
}

function validateCoordinates(lat: number | undefined, lng: number | undefined) {
	if ((lat === undefined) !== (lng === undefined)) {
		throw new Error('Breiten- und Längengrad müssen gemeinsam angegeben werden');
	}
	if (lat !== undefined && (lat < -90 || lat > 90)) {
		throw new Error('Breitengrad ist ungültig');
	}
	if (lng !== undefined && (lng < -180 || lng > 180)) {
		throw new Error('Längengrad ist ungültig');
	}
}

async function saveRoleLogic(ctx: MutationCtx & { user: Doc<'users'> }, role: OnboardingRole) {
	const draft = await getDraft(ctx, ctx.user._id);
	if (ctx.user.onboardingCompleted || draft?.step === 'complete') {
		throw new Error('Onboarding ist bereits abgeschlossen');
	}
	const now = Date.now();
	if (!draft) {
		await ctx.db.insert('onboardingDrafts', {
			userId: ctx.user._id,
			role,
			step: 'profile',
			createdAt: now,
			updatedAt: now
		});
		return;
	}
	if (draft.role === role) {
		await ctx.db.patch('onboardingDrafts', draft._id, { updatedAt: now });
		return;
	}
	await ctx.db.patch('onboardingDrafts', draft._id, {
		role,
		step: 'profile',
		name: undefined,
		bio: undefined,
		city: undefined,
		country: undefined,
		lat: undefined,
		lng: undefined,
		website: undefined,
		instagram: undefined,
		genres: undefined,
		feeMin: undefined,
		feeMax: undefined,
		currency: undefined,
		soundcloud: undefined,
		mixUrl: undefined,
		address: undefined,
		capacity: undefined,
		updatedAt: now
	});
}

async function saveProfileLogic(
	ctx: MutationCtx & { user: Doc<'users'> },
	input: Infer<typeof onboardingProfileInput>
) {
	const draft = await getDraft(ctx, ctx.user._id);
	assertCanEdit(ctx.user, draft);
	assertStepReached(draft, 'profile');
	const name = input.name.trim();
	const bio = input.bio.trim();
	if (name.length < 2) {
		throw new Error('Name muss mindestens 2 Zeichen haben');
	}
	if (bio.length === 0) {
		throw new Error('Bitte ein Kurzprofil angeben');
	}
	await ctx.db.patch('onboardingDrafts', draft._id, {
		name,
		bio,
		step: nextUnlockedStep(draft.step, 'details'),
		updatedAt: Date.now()
	});
}

function validateDetails(draft: Draft, input: OnboardingDetails) {
	if (draft.role !== input.role) {
		throw new Error('Die Angaben passen nicht zur ausgewählten Rolle');
	}
	if (input.city.trim().length === 0 || input.country.trim().length === 0) {
		throw new Error('Stadt und Land sind erforderlich');
	}
	validateCoordinates(input.lat, input.lng);
	if (input.role === 'dj') {
		const genres = [...new Set(input.genres.map((genre) => genre.trim()).filter(Boolean))];
		if (genres.length === 0) throw new Error('Mindestens ein Genre ist erforderlich');
		if (input.feeMin !== undefined && input.feeMin < 0) {
			throw new Error('Mindestgage darf nicht negativ sein');
		}
		if (input.feeMax !== undefined && input.feeMax < 0) {
			throw new Error('Höchstgage darf nicht negativ sein');
		}
		if (input.feeMin !== undefined && input.feeMax !== undefined && input.feeMin > input.feeMax) {
			throw new Error('Mindestgage darf nicht über der Höchstgage liegen');
		}
		return { ...input, genres };
	}
	if (input.role === 'venue') {
		if (input.address.trim().length === 0) {
			throw new Error('Adresse ist erforderlich');
		}
		if (input.capacity !== undefined && input.capacity <= 0) {
			throw new Error('Kapazität muss größer als 0 sein');
		}
	}
	return input;
}

async function saveDetailsLogic(
	ctx: MutationCtx & { user: Doc<'users'> },
	input: OnboardingDetails
) {
	const draft = await getDraft(ctx, ctx.user._id);
	assertCanEdit(ctx.user, draft);
	assertStepReached(draft, 'details');
	const details = validateDetails(draft, input);
	const common = {
		city: details.city.trim(),
		country: details.country.trim(),
		lat: details.lat,
		lng: details.lng,
		website: 'website' in details ? cleanOptional(details.website) : undefined,
		instagram: cleanOptional(details.instagram),
		step: nextUnlockedStep(draft.step, 'review'),
		updatedAt: Date.now()
	};
	if (details.role === 'dj') {
		await ctx.db.patch('onboardingDrafts', draft._id, {
			...common,
			genres: details.genres,
			feeMin: details.feeMin,
			feeMax: details.feeMax,
			currency: cleanOptional(details.currency) ?? 'EUR',
			soundcloud: cleanOptional(details.soundcloud),
			mixUrl: cleanOptional(details.mixUrl)
		});
		return;
	}
	if (details.role === 'venue') {
		await ctx.db.patch('onboardingDrafts', draft._id, {
			...common,
			address: details.address.trim(),
			capacity: details.capacity
		});
		return;
	}
	await ctx.db.patch('onboardingDrafts', draft._id, common);
}

function assertCompleteDraft(draft: Draft): asserts draft is CompleteDraft {
	if (draft.step !== 'review') {
		throw new Error('Bitte alle Onboarding-Schritte abschließen');
	}
	if (!draft.name || !draft.bio || !draft.city || !draft.country) {
		throw new Error('Der Onboarding-Entwurf ist unvollständig');
	}
	if (draft.role === 'dj' && (!draft.genres || draft.genres.length === 0)) {
		throw new Error('DJ-Angaben sind unvollständig');
	}
	if (draft.role === 'venue' && !draft.address) {
		throw new Error('Venue-Angaben sind unvollständig');
	}
}

async function uniqueSlug(
	ctx: MutationCtx,
	table: 'djProfiles' | 'organizations' | 'venues',
	base: string
) {
	const fallback = table === 'djProfiles' ? 'dj' : table === 'venues' ? 'venue' : 'organisation';
	const root = slugify(base) || fallback;
	let suffix = 0;
	while (true) {
		const candidate = suffix === 0 ? root : `${root}-${suffix}`;
		const existing = await ctx.db
			.query(table)
			.withIndex('by_slug', (q) => q.eq('slug', candidate))
			.unique();
		if (!existing) return candidate;
		suffix += 1;
	}
}

function completedResult(draft: Draft) {
	return {
		role: draft.role,
		djProfileId: draft.resultDjProfileId ?? null,
		organizationId: draft.resultOrganizationId ?? null,
		venueId: draft.resultVenueId ?? null
	};
}

async function finalizeLogic(ctx: MutationCtx & { user: Doc<'users'> }) {
	const draft = await getDraft(ctx, ctx.user._id);
	if (!draft) throw new Error('Onboarding-Entwurf nicht gefunden');
	if (draft.step === 'complete') {
		return completedResult(draft);
	}
	if (ctx.user.onboardingCompleted) {
		throw new Error('Onboarding ist bereits abgeschlossen');
	}
	assertCompleteDraft(draft);

	const now = Date.now();
	const geohash =
		draft.lat !== undefined && draft.lng !== undefined
			? encodeGeohash(draft.lat, draft.lng)
			: undefined;
	let djProfileId: Id<'djProfiles'> | null = null;
	let organizationId: Id<'organizations'> | null = null;
	let venueId: Id<'venues'> | null = null;

	if (draft.role === 'dj') {
		const slug = await uniqueSlug(ctx, 'djProfiles', draft.name);
		djProfileId = await ctx.db.insert('djProfiles', {
			userId: ctx.user._id,
			slug,
			stageName: draft.name,
			bio: draft.bio,
			genres: draft.genres ?? [],
			feeMin: draft.feeMin,
			feeMax: draft.feeMax,
			currency: draft.currency ?? 'EUR',
			city: draft.city,
			country: draft.country,
			lat: draft.lat,
			lng: draft.lng,
			geohash,
			soundcloud: draft.soundcloud,
			instagram: draft.instagram,
			mixUrl: draft.mixUrl,
			verified: false,
			featured: false,
			published: false,
			createdAt: now,
			updatedAt: now
		});
	} else {
		const slug = await uniqueSlug(ctx, 'organizations', draft.name);
		organizationId = await ctx.db.insert('organizations', {
			name: draft.name,
			slug,
			type: draft.role,
			bio: draft.bio,
			city: draft.city,
			country: draft.country,
			lat: draft.lat,
			lng: draft.lng,
			geohash,
			website: draft.website,
			instagram: draft.instagram,
			verified: false,
			featured: false,
			createdAt: now,
			updatedAt: now
		});
		await ctx.db.insert('memberships', {
			userId: ctx.user._id,
			organizationId,
			role: 'owner',
			createdAt: now
		});
		if (draft.role === 'venue') {
			const venueSlug = await uniqueSlug(ctx, 'venues', draft.name);
			venueId = await ctx.db.insert('venues', {
				organizationId,
				slug: venueSlug,
				name: draft.name,
				bio: draft.bio,
				address: draft.address ?? '',
				city: draft.city,
				country: draft.country,
				capacity: draft.capacity,
				lat: draft.lat,
				lng: draft.lng,
				geohash,
				website: draft.website,
				instagram: draft.instagram,
				photoStorageIds: [],
				verified: false,
				featured: false,
				published: false,
				createdAt: now,
				updatedAt: now
			});
		}
	}

	await ctx.db.patch('onboardingDrafts', draft._id, {
		step: 'complete',
		resultDjProfileId: djProfileId ?? undefined,
		resultOrganizationId: organizationId ?? undefined,
		resultVenueId: venueId ?? undefined,
		updatedAt: now
	});
	await ctx.db.patch('users', ctx.user._id, {
		onboardingCompleted: true,
		updatedAt: now
	});
	return { role: draft.role, djProfileId, organizationId, venueId };
}

export const getState = authedQuery({
	args: {},
	returns: publicOnboardingState,
	handler: async (ctx) => {
		const draft = await ctx.db
			.query('onboardingDrafts')
			.withIndex('by_user', (q) => q.eq('userId', ctx.user._id))
			.unique();
		return toPublicState(draft, ctx.user.onboardingCompleted);
	}
});

export const saveRole = authedMutation({
	args: { role: onboardingRole },
	returns: publicOnboardingState,
	handler: async (ctx, args) => {
		await saveRoleLogic(ctx, args.role);
		const draft = await getDraft(ctx, ctx.user._id);
		return toPublicState(draft, ctx.user.onboardingCompleted);
	}
});

export const saveProfile = authedMutation({
	args: { profile: onboardingProfileInput },
	returns: publicOnboardingState,
	handler: async (ctx, args) => {
		await saveProfileLogic(ctx, args.profile);
		const draft = await getDraft(ctx, ctx.user._id);
		return toPublicState(draft, ctx.user.onboardingCompleted);
	}
});

export const saveDetails = authedMutation({
	args: { details: onboardingDetailsInput },
	returns: publicOnboardingState,
	handler: async (ctx, args) => {
		await saveDetailsLogic(ctx, args.details);
		const draft = await getDraft(ctx, ctx.user._id);
		return toPublicState(draft, ctx.user.onboardingCompleted);
	}
});

export const finalize = authedMutation({
	args: {},
	returns: onboardingFinalizeResult,
	handler: async (ctx) => {
		return await finalizeLogic(ctx);
	}
});
