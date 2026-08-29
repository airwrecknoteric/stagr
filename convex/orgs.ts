import { v } from "convex/values";
import { query } from "./_generated/server";
import { authedMutation, authedQuery, orgMutation } from "./lib/customFunctions";
import { encodeGeohash, slugify } from "./lib/geo";
import { membershipRole, organizationDoc, orgType } from "./lib/validators";

async function uniqueOrgSlug(
	ctx: { db: import("./_generated/server").MutationCtx["db"] },
	base: string
) {
	const slug = slugify(base);
	let n = 0;
	while (true) {
		const candidate = n === 0 ? slug : `${slug}-${n}`;
		const existing = await ctx.db
			.query("organizations")
			.withIndex("by_slug", (q) => q.eq("slug", candidate))
			.unique();
		if (!existing) return candidate;
		n += 1;
	}
}

const membershipWithOrg = v.object({
	_id: v.id("memberships"),
	role: membershipRole,
	organization: organizationDoc
});

export const mine = authedQuery({
	args: {},
	returns: v.array(membershipWithOrg),
	handler: async (ctx) => {
		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.take(50);
		const result = [];
		for (const membership of memberships) {
			const organization = await ctx.db.get(membership.organizationId);
			if (organization) {
				result.push({
					_id: membership._id,
					role: membership.role,
					organization
				});
			}
		}
		return result;
	}
});

export const getBySlug = query({
	args: { slug: v.string() },
	returns: v.union(organizationDoc, v.null()),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("organizations")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();
	}
});

export const create = authedMutation({
	args: {
		name: v.string(),
		type: orgType,
		bio: v.optional(v.string()),
		city: v.optional(v.string()),
		country: v.optional(v.string()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		website: v.optional(v.string()),
		instagram: v.optional(v.string())
	},
	returns: v.id("organizations"),
	handler: async (ctx, args) => {
		if (args.name.trim().length < 2) {
			throw new Error("Name muss mindestens 2 Zeichen haben");
		}
		const now = Date.now();
		const slug = await uniqueOrgSlug(ctx, args.name);
		const geohash =
			args.lat !== undefined && args.lng !== undefined
				? encodeGeohash(args.lat, args.lng)
				: undefined;
		const organizationId = await ctx.db.insert("organizations", {
			name: args.name.trim(),
			slug,
			type: args.type,
			bio: args.bio,
			city: args.city,
			country: args.country,
			lat: args.lat,
			lng: args.lng,
			geohash,
			website: args.website,
			instagram: args.instagram,
			verified: false,
			featured: false,
			createdAt: now,
			updatedAt: now
		});
		await ctx.db.insert("memberships", {
			userId: ctx.user._id,
			organizationId,
			role: "owner",
			createdAt: now
		});
		await ctx.db.patch(ctx.user._id, {
			onboardingCompleted: true,
			updatedAt: now
		});
		return organizationId;
	}
});

export const update = orgMutation({
	args: {
		name: v.optional(v.string()),
		bio: v.optional(v.string()),
		city: v.optional(v.string()),
		country: v.optional(v.string()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		website: v.optional(v.string()),
		instagram: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const geohash =
			args.lat !== undefined && args.lng !== undefined
				? encodeGeohash(args.lat, args.lng)
				: undefined;
		await ctx.db.patch(ctx.organizationId, {
			name: args.name,
			bio: args.bio,
			city: args.city,
			country: args.country,
			lat: args.lat,
			lng: args.lng,
			geohash,
			website: args.website,
			instagram: args.instagram,
			updatedAt: Date.now()
		});
		return null;
	}
});
