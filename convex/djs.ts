import { v } from "convex/values";
import { query } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { encodeGeohash, slugify } from "./lib/geo";
import { djProfileDoc } from "./lib/validators";

async function uniqueDjSlug(ctx: { db: import("./_generated/server").MutationCtx["db"] }, base: string) {
	const slug = slugify(base);
	let n = 0;
	while (true) {
		const candidate = n === 0 ? slug : `${slug}-${n}`;
		const existing = await ctx.db
			.query("djProfiles")
			.withIndex("by_slug", (q) => q.eq("slug", candidate))
			.unique();
		if (!existing) return candidate;
		n += 1;
	}
}

export const getBySlug = query({
	args: { slug: v.string() },
	returns: v.union(
		v.object({
			profile: djProfileDoc,
			avatarUrl: v.union(v.string(), v.null()),
			techRiderUrl: v.union(v.string(), v.null()),
			management: v.union(
				v.object({
					name: v.string(),
					slug: v.string()
				}),
				v.null()
			)
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query("djProfiles")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();
		if (!profile || !profile.published) return null;

		const roster = await ctx.db
			.query("rosterEntries")
			.withIndex("by_dj", (q) => q.eq("djProfileId", profile._id))
			.take(10);
		const active = roster.find((entry) => entry.status === "active");
		const management = active ? await ctx.db.get(active.managementId) : null;

		return {
			profile,
			avatarUrl: profile.avatarStorageId
				? await ctx.storage.getUrl(profile.avatarStorageId)
				: null,
			techRiderUrl: profile.techRiderStorageId
				? await ctx.storage.getUrl(profile.techRiderStorageId)
				: null,
			management: management
				? { name: management.name, slug: management.slug }
				: null
		};
	}
});

export const mine = authedQuery({
	args: {},
	returns: v.union(djProfileDoc, v.null()),
	handler: async (ctx) => {
		return await ctx.db
			.query("djProfiles")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
	}
});

export const createOrUpdate = authedMutation({
	args: {
		stageName: v.string(),
		bio: v.string(),
		genres: v.array(v.string()),
		feeMin: v.optional(v.number()),
		feeMax: v.optional(v.number()),
		currency: v.optional(v.string()),
		city: v.string(),
		country: v.string(),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		soundcloud: v.optional(v.string()),
		instagram: v.optional(v.string()),
		mixUrl: v.optional(v.string()),
		published: v.optional(v.boolean())
	},
	returns: v.id("djProfiles"),
	handler: async (ctx, args) => {
		if (args.stageName.trim().length < 2) {
			throw new Error("Künstlername muss mindestens 2 Zeichen haben");
		}
		const now = Date.now();
		const geohash =
			args.lat !== undefined && args.lng !== undefined
				? encodeGeohash(args.lat, args.lng)
				: undefined;
		const existing = await ctx.db
			.query("djProfiles")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();

		const patch = {
			stageName: args.stageName.trim(),
			bio: args.bio,
			genres: args.genres,
			feeMin: args.feeMin,
			feeMax: args.feeMax,
			currency: args.currency ?? "EUR",
			city: args.city,
			country: args.country,
			lat: args.lat,
			lng: args.lng,
			geohash,
			soundcloud: args.soundcloud,
			instagram: args.instagram,
			mixUrl: args.mixUrl,
			published: args.published ?? true,
			updatedAt: now
		};

		if (existing) {
			await ctx.db.patch(existing._id, patch);
			await ctx.db.patch(ctx.user._id, {
				onboardingCompleted: true,
				updatedAt: now
			});
			return existing._id;
		}

		const slug = await uniqueDjSlug(ctx, args.stageName);
		const id = await ctx.db.insert("djProfiles", {
			userId: ctx.user._id,
			slug,
			verified: false,
			featured: false,
			createdAt: now,
			...patch
		});
		await ctx.db.patch(ctx.user._id, {
			onboardingCompleted: true,
			updatedAt: now
		});
		return id;
	}
});

export const attachAvatar = authedMutation({
	args: { storageId: v.id("_storage") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query("djProfiles")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
		if (!profile) throw new Error("DJ-Profil nicht gefunden");
		await ctx.db.patch(profile._id, {
			avatarStorageId: args.storageId,
			updatedAt: Date.now()
		});
		return null;
	}
});

export const attachTechRider = authedMutation({
	args: { storageId: v.id("_storage") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query("djProfiles")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
		if (!profile) throw new Error("DJ-Profil nicht gefunden");
		await ctx.db.patch(profile._id, {
			techRiderStorageId: args.storageId,
			updatedAt: Date.now()
		});
		return null;
	}
});
