import { v } from "convex/values";
import { query } from "./_generated/server";
import { authedMutation, authedQuery, orgMutation, orgQuery } from "./lib/customFunctions";
import { notify } from "./lib/auth";
import { djProfileDoc, organizationDoc } from "./lib/validators";

const rosterRow = v.object({
	_id: v.id("rosterEntries"),
	exclusive: v.boolean(),
	canNegotiate: v.boolean(),
	status: v.union(v.literal("pending"), v.literal("active"), v.literal("ended")),
	dj: djProfileDoc,
	avatarUrl: v.union(v.string(), v.null())
});

export const listPublic = query({
	args: { slug: v.string() },
	returns: v.union(
		v.object({
			organization: organizationDoc,
			djs: v.array(
				v.object({
					profile: djProfileDoc,
					avatarUrl: v.union(v.string(), v.null()),
					exclusive: v.boolean()
				})
			)
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const organization = await ctx.db
			.query("organizations")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();
		if (!organization || organization.type !== "management") return null;

		const entries = await ctx.db
			.query("rosterEntries")
			.withIndex("by_management_and_status", (q) =>
				q.eq("managementId", organization._id).eq("status", "active")
			)
			.take(100);

		const djs = [];
		for (const entry of entries) {
			const profile = await ctx.db.get(entry.djProfileId);
			if (!profile || !profile.published) continue;
			djs.push({
				profile,
				avatarUrl: profile.avatarStorageId
					? await ctx.storage.getUrl(profile.avatarStorageId)
					: null,
				exclusive: entry.exclusive
			});
		}
		return { organization, djs };
	}
});

export const mine = orgQuery({
	args: {},
	returns: v.array(rosterRow),
	handler: async (ctx) => {
		const entries = await ctx.db
			.query("rosterEntries")
			.withIndex("by_management", (q) => q.eq("managementId", ctx.organizationId))
			.take(100);
		const rows = [];
		for (const entry of entries) {
			const dj = await ctx.db.get(entry.djProfileId);
			if (!dj) continue;
			rows.push({
				_id: entry._id,
				exclusive: entry.exclusive,
				canNegotiate: entry.canNegotiate,
				status: entry.status,
				dj,
				avatarUrl: dj.avatarStorageId ? await ctx.storage.getUrl(dj.avatarStorageId) : null
			});
		}
		return rows;
	}
});

export const inviteBySlug = orgMutation({
	args: {
		djSlug: v.string(),
		exclusive: v.boolean(),
		canNegotiate: v.boolean()
	},
	returns: v.id("rosterEntries"),
	handler: async (ctx, args) => {
		const org = await ctx.db.get(ctx.organizationId);
		if (!org || org.type !== "management") {
			throw new Error("Nur Managements können ein Roster führen");
		}
		const dj = await ctx.db
			.query("djProfiles")
			.withIndex("by_slug", (q) => q.eq("slug", args.djSlug.trim().toLowerCase()))
			.unique();
		if (!dj) throw new Error("DJ nicht gefunden");

		const existing = await ctx.db
			.query("rosterEntries")
			.withIndex("by_management_and_dj", (q) =>
				q.eq("managementId", ctx.organizationId).eq("djProfileId", dj._id)
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				exclusive: args.exclusive,
				canNegotiate: args.canNegotiate,
				status: "pending"
			});
			await notify(
				ctx,
				dj.userId,
				"Roster-Einladung",
				`${org.name} möchte dich ins Roster aufnehmen.`,
				"/app/settings"
			);
			return existing._id;
		}

		const id = await ctx.db.insert("rosterEntries", {
			managementId: ctx.organizationId,
			djProfileId: dj._id,
			exclusive: args.exclusive,
			canNegotiate: args.canNegotiate,
			status: "pending",
			createdAt: Date.now()
		});
		await notify(
			ctx,
			dj.userId,
			"Roster-Einladung",
			`${org.name} möchte dich ins Roster aufnehmen.`,
			"/app/settings"
		);
		return id;
	}
});

export const myInvites = authedQuery({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("rosterEntries"),
			exclusive: v.boolean(),
			canNegotiate: v.boolean(),
			status: v.union(v.literal("pending"), v.literal("active"), v.literal("ended")),
			organization: organizationDoc
		})
	),
	handler: async (ctx) => {
		const profile = await ctx.db
			.query("djProfiles")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
		if (!profile) return [];
		const entries = await ctx.db
			.query("rosterEntries")
			.withIndex("by_dj", (q) => q.eq("djProfileId", profile._id))
			.take(50);
		const result = [];
		for (const entry of entries) {
			const organization = await ctx.db.get(entry.managementId);
			if (organization) {
				result.push({
					_id: entry._id,
					exclusive: entry.exclusive,
					canNegotiate: entry.canNegotiate,
					status: entry.status,
					organization
				});
			}
		}
		return result;
	}
});

export const respond = authedMutation({
	args: {
		entryId: v.id("rosterEntries"),
		accept: v.boolean()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.entryId);
		if (!entry) throw new Error("Eintrag nicht gefunden");
		const profile = await ctx.db.get(entry.djProfileId);
		if (!profile || profile.userId !== ctx.user._id) {
			throw new Error("Keine Berechtigung");
		}
		await ctx.db.patch(args.entryId, {
			status: args.accept ? "active" : "ended"
		});
		const org = await ctx.db.get(entry.managementId);
		if (org) {
			const owners = await ctx.db
				.query("memberships")
				.withIndex("by_org", (q) => q.eq("organizationId", org._id))
				.take(20);
			for (const member of owners) {
				if (member.role === "owner") {
					await notify(
						ctx,
						member.userId,
						args.accept ? "Roster bestätigt" : "Roster abgelehnt",
						`${profile.stageName} hat die Einladung ${args.accept ? "angenommen" : "abgelehnt"}.`,
						"/app/roster"
					);
				}
			}
		}
		return null;
	}
});
