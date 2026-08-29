import { v } from "convex/values";
import { query } from "./_generated/server";
import { haversineKm, hashesForRadius } from "./lib/geo";
import { publicDjCard } from "./lib/validators";

export const djs = query({
	args: {
		query: v.optional(v.string()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		radiusKm: v.optional(v.number()),
		genre: v.optional(v.string()),
		feeMax: v.optional(v.number()),
		limit: v.optional(v.number())
	},
	returns: v.array(publicDjCard),
	handler: async (ctx, args) => {
		const limit = Math.min(args.limit ?? 40, 80);
		let profiles;

		const text = args.query?.trim();
		if (text && text.length >= 2) {
			profiles = await ctx.db
				.query("djProfiles")
				.withSearchIndex("search_name", (q) =>
					q.search("stageName", text).eq("published", true)
				)
				.take(limit);
		} else if (args.lat !== undefined && args.lng !== undefined) {
			const hashes = hashesForRadius(args.lat, args.lng, args.radiusKm ?? 50);
			const found = [];
			const seen = new Set<string>();
			for (const hash of hashes) {
				const prefix = hash.slice(0, 4);
				const rows = await ctx.db
					.query("djProfiles")
					.withIndex("by_geohash", (q) =>
						q.gte("geohash", prefix).lt("geohash", prefix + "\uffff")
					)
					.take(80);
				for (const row of rows) {
					if (seen.has(row._id) || !row.published) continue;
					seen.add(row._id);
					found.push(row);
				}
			}
			profiles = found;
		} else {
			profiles = await ctx.db
				.query("djProfiles")
				.withIndex("by_published", (q) => q.eq("published", true))
				.take(limit);
		}

		const cards = [];
		for (const profile of profiles) {
			if (args.genre && !profile.genres.includes(args.genre)) continue;
			if (args.feeMax !== undefined && profile.feeMin !== undefined && profile.feeMin > args.feeMax) {
				continue;
			}
			let distanceKm: number | undefined;
			if (
				args.lat !== undefined &&
				args.lng !== undefined &&
				profile.lat !== undefined &&
				profile.lng !== undefined
			) {
				distanceKm = haversineKm(args.lat, args.lng, profile.lat, profile.lng);
				if (args.radiusKm !== undefined && distanceKm > args.radiusKm) continue;
			}

			const roster = await ctx.db
				.query("rosterEntries")
				.withIndex("by_dj", (q) => q.eq("djProfileId", profile._id))
				.take(8);
			const active = roster.find((entry) => entry.status === "active");
			const management = active ? await ctx.db.get(active.managementId) : null;

			cards.push({
				_id: profile._id,
				slug: profile.slug,
				stageName: profile.stageName,
				bio: profile.bio,
				genres: profile.genres,
				feeMin: profile.feeMin,
				feeMax: profile.feeMax,
				currency: profile.currency,
				city: profile.city,
				country: profile.country,
				lat: profile.lat,
				lng: profile.lng,
				verified: profile.verified,
				featured: profile.featured,
				avatarUrl: profile.avatarStorageId
					? await ctx.storage.getUrl(profile.avatarStorageId)
					: null,
				distanceKm,
				managementName: management?.name,
				managementSlug: management?.slug
			});
			if (cards.length >= limit) break;
		}

		cards.sort((a, b) => {
			if (a.featured !== b.featured) return a.featured ? -1 : 1;
			if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
				return a.distanceKm - b.distanceKm;
			}
			return a.stageName.localeCompare(b.stageName);
		});
		return cards;
	}
});

export const featured = query({
	args: {},
	returns: v.array(publicDjCard),
	handler: async (ctx) => {
		const profiles = await ctx.db
			.query("djProfiles")
			.withIndex("by_featured", (q) => q.eq("featured", true))
			.take(12);
		const cards = [];
		for (const profile of profiles) {
			if (!profile.published) continue;
			cards.push({
				_id: profile._id,
				slug: profile.slug,
				stageName: profile.stageName,
				bio: profile.bio,
				genres: profile.genres,
				feeMin: profile.feeMin,
				feeMax: profile.feeMax,
				currency: profile.currency,
				city: profile.city,
				country: profile.country,
				lat: profile.lat,
				lng: profile.lng,
				verified: profile.verified,
				featured: profile.featured,
				avatarUrl: profile.avatarStorageId
					? await ctx.storage.getUrl(profile.avatarStorageId)
					: null
			});
		}
		return cards;
	}
});

export const managements = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("organizations"),
			name: v.string(),
			slug: v.string(),
			city: v.optional(v.string()),
			bio: v.optional(v.string()),
			verified: v.boolean()
		})
	),
	handler: async (ctx) => {
		const orgs = await ctx.db
			.query("organizations")
			.withIndex("by_type", (q) => q.eq("type", "management"))
			.take(40);
		return orgs.map((org) => ({
			_id: org._id,
			name: org.name,
			slug: org.slug,
			city: org.city,
			bio: org.bio,
			verified: org.verified
		}));
	}
});
