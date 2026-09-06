import { v } from 'convex/values';
import { query } from './_generated/server';
import { orgMutation } from './lib/customFunctions';
import { encodeGeohash, slugify } from './lib/geo';
import { publicVenueProfile } from './lib/validators';

async function uniqueVenueSlug(
	ctx: { db: import('./_generated/server').MutationCtx['db'] },
	base: string
) {
	const slug = slugify(base);
	let n = 0;
	while (true) {
		const candidate = n === 0 ? slug : `${slug}-${n}`;
		const existing = await ctx.db
			.query('venues')
			.withIndex('by_slug', (q) => q.eq('slug', candidate))
			.unique();
		if (!existing) return candidate;
		n += 1;
	}
}

export const getBySlug = query({
	args: { slug: v.string() },
	returns: v.union(
		v.object({
			venue: publicVenueProfile,
			photoUrls: v.array(v.string())
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const venue = await ctx.db
			.query('venues')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!venue || !venue.published) return null;
		const photoUrls: string[] = [];
		for (const storageId of venue.photoStorageIds) {
			const url = await ctx.storage.getUrl(storageId);
			if (url) photoUrls.push(url);
		}
		return {
			venue: {
				_id: venue._id,
				slug: venue.slug,
				name: venue.name,
				bio: venue.bio,
				address: venue.address,
				city: venue.city,
				country: venue.country,
				capacity: venue.capacity,
				lat: venue.lat,
				lng: venue.lng,
				website: venue.website,
				instagram: venue.instagram,
				verified: venue.verified,
				featured: venue.featured
			},
			photoUrls
		};
	}
});

export const createOrUpdate = orgMutation({
	args: {
		name: v.string(),
		bio: v.string(),
		address: v.string(),
		city: v.string(),
		country: v.string(),
		capacity: v.optional(v.number()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		website: v.optional(v.string()),
		instagram: v.optional(v.string()),
		published: v.optional(v.boolean())
	},
	returns: v.id('venues'),
	handler: async (ctx, args) => {
		const org = await ctx.db.get(ctx.organizationId);
		if (!org || org.type !== 'venue') {
			throw new Error('Nur Locations können ein Venue-Profil anlegen');
		}
		const now = Date.now();
		const geohash =
			args.lat !== undefined && args.lng !== undefined
				? encodeGeohash(args.lat, args.lng)
				: undefined;
		const existing = await ctx.db
			.query('venues')
			.withIndex('by_org', (q) => q.eq('organizationId', ctx.organizationId))
			.unique();
		const patch = {
			name: args.name.trim(),
			bio: args.bio,
			address: args.address,
			city: args.city,
			country: args.country,
			capacity: args.capacity,
			lat: args.lat,
			lng: args.lng,
			geohash,
			website: args.website,
			instagram: args.instagram,
			published: args.published ?? true,
			updatedAt: now
		};
		if (existing) {
			await ctx.db.patch(existing._id, patch);
			return existing._id;
		}
		const slug = await uniqueVenueSlug(ctx, args.name);
		return await ctx.db.insert('venues', {
			organizationId: ctx.organizationId,
			slug,
			photoStorageIds: [],
			verified: false,
			featured: false,
			createdAt: now,
			...patch
		});
	}
});
