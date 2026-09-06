/// <reference types="vite/client" />

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob(['../../convex/**/*.{js,ts}', '!../../convex/**/*.d.ts']);

const roles = ['dj', 'promoter', 'venue', 'management'] as const;
type Role = (typeof roles)[number];

function validDetails(role: Role) {
	const common = {
		city: 'Berlin',
		country: 'Deutschland',
		lat: 52.52,
		lng: 13.405
	};

	switch (role) {
		case 'dj':
			return {
				role,
				...common,
				genres: ['House', 'Techno'],
				feeMin: 500,
				feeMax: 1200,
				currency: 'EUR',
				soundcloud: 'https://soundcloud.com/test-dj',
				instagram: '@test-dj',
				mixUrl: 'https://example.com/mix'
			};
		case 'venue':
			return {
				role,
				...common,
				address: 'Teststraße 1',
				capacity: 450,
				website: 'https://venue.example',
				instagram: '@test-venue'
			};
		case 'promoter':
		case 'management':
			return {
				role,
				...common,
				website: `https://${role}.example`,
				instagram: `@test-${role}`
			};
	}
}

async function createSession(label: string) {
	const t = convexTest({ schema, modules });
	const subject = `onboarding-${label}`;
	const tokenIdentifier = `https://clerk.test|${subject}`;
	const asUser = t.withIdentity({
		subject,
		issuer: 'https://clerk.test',
		tokenIdentifier,
		email: `${subject}@example.test`,
		name: `Test ${label}`
	});
	const userId = await asUser.mutation(api.users.store, {});

	return { t, asUser, userId };
}

describe('Onboarding-Zugriffsschutz', () => {
	it('lehnt einen fachlichen onboarded-Endpunkt vor Abschluss ab', async () => {
		const { asUser } = await createSession('guard');

		await expect(asUser.query(api.djs.mine, {})).rejects.toThrow(
			'Onboarding muss zuerst abgeschlossen werden'
		);
	});

	it('startet ohne Rolle und erlaubt keinen Sprung zum Profil', async () => {
		const { asUser } = await createSession('initial');

		await expect(
			asUser.mutation(api.onboarding.saveProfile, {
				profile: { name: 'Zu früh', bio: 'Dieser Schritt ist noch gesperrt.' }
			})
		).rejects.toThrow('Bitte zuerst eine Rolle auswählen');

		await expect(asUser.query(api.onboarding.getState, {})).resolves.toEqual({
			role: null,
			step: 'role'
		});
	});
});

describe.each(roles)('Onboarding für Rolle %s', (role) => {
	it('erzwingt die Schrittfolge, stellt State wieder her und finalisiert idempotent', async () => {
		const { t, asUser, userId } = await createSession(role);

		const initial = await asUser.query(api.onboarding.getState, {});
		expect(initial).toEqual({ role: null, step: 'role' });

		const afterRole = await asUser.mutation(api.onboarding.saveRole, { role });
		expect(afterRole).toMatchObject({ role, step: 'profile' });

		await expect(
			asUser.mutation(api.onboarding.saveDetails, {
				details: validDetails(role)
			})
		).rejects.toThrow('Schritt details ist noch nicht freigeschaltet');
		await expect(asUser.mutation(api.onboarding.finalize, {})).rejects.toThrow(
			'Bitte alle Onboarding-Schritte abschließen'
		);

		const reloadedAfterRole = await asUser.query(api.onboarding.getState, {});
		expect(reloadedAfterRole).toEqual(afterRole);

		const afterProfile = await asUser.mutation(api.onboarding.saveProfile, {
			profile: {
				name: role === 'dj' ? 'Deep Test DJ' : `Test ${role}`,
				bio: `Vollständiges Testprofil für ${role}.`
			}
		});
		expect(afterProfile).toMatchObject({ role, step: 'details' });

		const beforeDetails = await asUser.query(api.users.me, {});
		expect(beforeDetails?.onboardingCompleted).toBe(false);

		const afterDetails = await asUser.mutation(api.onboarding.saveDetails, {
			details: validDetails(role)
		});
		expect(afterDetails).toMatchObject({
			role,
			step: 'review',
			city: 'Berlin',
			country: 'Deutschland'
		});
		expect(await asUser.query(api.onboarding.getState, {})).toEqual(afterDetails);

		const beforeFinalize = await asUser.query(api.users.me, {});
		expect(beforeFinalize?.onboardingCompleted).toBe(false);

		const firstResult = await asUser.mutation(api.onboarding.finalize, {});
		expect(firstResult.role).toBe(role);
		expect(await asUser.query(api.onboarding.getState, {})).toMatchObject({
			role,
			step: 'complete'
		});
		expect((await asUser.query(api.users.me, {}))?.onboardingCompleted).toBe(true);

		const countsAfterFirstFinalize = await t.run(async (ctx) => ({
			drafts: (await ctx.db.query('onboardingDrafts').collect()).length,
			djProfiles: (await ctx.db.query('djProfiles').collect()).length,
			organizations: (await ctx.db.query('organizations').collect()).length,
			memberships: (await ctx.db.query('memberships').collect()).length,
			venues: (await ctx.db.query('venues').collect()).length
		}));

		const secondResult = await asUser.mutation(api.onboarding.finalize, {});
		expect(secondResult).toEqual(firstResult);

		const countsAfterSecondFinalize = await t.run(async (ctx) => ({
			drafts: (await ctx.db.query('onboardingDrafts').collect()).length,
			djProfiles: (await ctx.db.query('djProfiles').collect()).length,
			organizations: (await ctx.db.query('organizations').collect()).length,
			memberships: (await ctx.db.query('memberships').collect()).length,
			venues: (await ctx.db.query('venues').collect()).length
		}));
		expect(countsAfterSecondFinalize).toEqual(countsAfterFirstFinalize);
		expect(countsAfterSecondFinalize.drafts).toBe(1);

		const persisted = await t.run(async (ctx) => {
			const user = await ctx.db.get(userId);
			const draft = await ctx.db
				.query('onboardingDrafts')
				.withIndex('by_user', (q) => q.eq('userId', userId))
				.unique();
			return { user, draft };
		});
		expect(persisted.user?.onboardingCompleted).toBe(true);
		expect(persisted.draft?.step).toBe('complete');

		if (role === 'dj') {
			expect(firstResult).toMatchObject({
				djProfileId: expect.any(String),
				organizationId: null,
				venueId: null
			});
			const profile = await t.run(async (ctx) =>
				ctx.db
					.query('djProfiles')
					.withIndex('by_user', (q) => q.eq('userId', userId))
					.unique()
			);
			expect(profile).toMatchObject({
				stageName: 'Deep Test DJ',
				genres: ['House', 'Techno'],
				published: false,
				verified: false
			});
		} else {
			expect(firstResult.djProfileId).toBeNull();
			expect(firstResult.organizationId).not.toBeNull();
			expect(countsAfterFirstFinalize.organizations).toBe(1);
			expect(countsAfterFirstFinalize.memberships).toBe(1);
		}
	});
});

describe('Tiefe Rollenfälle', () => {
	it('setzt beim Rollenwechsel alle rollenspezifischen Daten zurück', async () => {
		const { asUser } = await createSession('role-reset');
		await asUser.mutation(api.onboarding.saveRole, { role: 'dj' });
		await asUser.mutation(api.onboarding.saveProfile, {
			profile: { name: 'Reset DJ', bio: 'Wird beim Rollenwechsel verworfen.' }
		});
		await asUser.mutation(api.onboarding.saveDetails, {
			details: validDetails('dj')
		});

		const reset = await asUser.mutation(api.onboarding.saveRole, { role: 'venue' });
		expect(reset).toEqual({ role: 'venue', step: 'profile' });
		expect(await asUser.query(api.onboarding.getState, {})).toEqual(reset);
		expect((await asUser.query(api.users.me, {}))?.onboardingCompleted).toBe(false);
	});

	it('erstellt Venue, Organisation und Owner-Mitgliedschaft gemeinsam und unveröffentlicht', async () => {
		const { t, asUser, userId } = await createSession('venue-atomic');
		await asUser.mutation(api.onboarding.saveRole, { role: 'venue' });
		await asUser.mutation(api.onboarding.saveProfile, {
			profile: { name: 'Atomic Venue', bio: 'Ein vollständig atomar angelegtes Venue.' }
		});
		await asUser.mutation(api.onboarding.saveDetails, {
			details: validDetails('venue')
		});

		const result = await asUser.mutation(api.onboarding.finalize, {});
		expect(result.organizationId).not.toBeNull();
		expect(result.venueId).not.toBeNull();

		const aggregate = await t.run(async (ctx) => {
			const organizations = await ctx.db.query('organizations').collect();
			const memberships = await ctx.db.query('memberships').collect();
			const venues = await ctx.db.query('venues').collect();
			return { organizations, memberships, venues };
		});

		expect(aggregate.organizations).toHaveLength(1);
		expect(aggregate.memberships).toHaveLength(1);
		expect(aggregate.venues).toHaveLength(1);
		expect(aggregate.memberships[0]).toMatchObject({
			userId,
			organizationId: result.organizationId,
			role: 'owner'
		});
		expect(aggregate.venues[0]).toMatchObject({
			organizationId: result.organizationId,
			_id: result.venueId,
			address: 'Teststraße 1',
			published: false,
			verified: false
		});
	});
});
