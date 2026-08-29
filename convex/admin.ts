import { v } from "convex/values";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { djProfileDoc, organizationDoc, userDoc } from "./lib/validators";

export const overview = adminQuery({
	args: {},
	returns: v.object({
		users: v.number(),
		djs: v.number(),
		bookings: v.number(),
		feePercent: v.number()
	}),
	handler: async (ctx) => {
		const users = await ctx.db.query("users").take(200);
		const djs = await ctx.db.query("djProfiles").take(200);
		const bookings = await ctx.db.query("bookings").take(200);
		const settings = await ctx.db
			.query("platformSettings")
			.withIndex("by_key", (q) => q.eq("key", "default"))
			.unique();
		return {
			users: users.length,
			djs: djs.length,
			bookings: bookings.length,
			feePercent: settings?.feePercent ?? 10
		};
	}
});

export const pendingDjs = adminQuery({
	args: {},
	returns: v.array(djProfileDoc),
	handler: async (ctx) => {
		const profiles = await ctx.db
			.query("djProfiles")
			.withIndex("by_published", (q) => q.eq("published", true))
			.take(80);
		return profiles.filter((profile) => !profile.verified);
	}
});

export const verifyDj = adminMutation({
	args: {
		djProfileId: v.id("djProfiles"),
		verified: v.boolean()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.djProfileId, {
			verified: args.verified,
			updatedAt: Date.now()
		});
		return null;
	}
});

export const featureDj = adminMutation({
	args: {
		djProfileId: v.id("djProfiles"),
		featured: v.boolean()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.djProfileId, {
			featured: args.featured,
			updatedAt: Date.now()
		});
		return null;
	}
});

export const verifyOrg = adminMutation({
	args: {
		organizationId: v.id("organizations"),
		verified: v.boolean()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.organizationId, {
			verified: args.verified,
			updatedAt: Date.now()
		});
		return null;
	}
});

export const setFeePercent = adminMutation({
	args: { feePercent: v.number() },
	returns: v.null(),
	handler: async (ctx, args) => {
		if (args.feePercent < 0 || args.feePercent > 30) {
			throw new Error("Provision muss zwischen 0 und 30% liegen");
		}
		const settings = await ctx.db
			.query("platformSettings")
			.withIndex("by_key", (q) => q.eq("key", "default"))
			.unique();
		if (settings) {
			await ctx.db.patch(settings._id, { feePercent: args.feePercent });
		} else {
			await ctx.db.insert("platformSettings", {
				key: "default",
				feePercent: args.feePercent
			});
		}
		return null;
	}
});

export const users = adminQuery({
	args: {},
	returns: v.array(userDoc),
	handler: async (ctx) => {
		return await ctx.db.query("users").take(100);
	}
});

export const orgs = adminQuery({
	args: {},
	returns: v.array(organizationDoc),
	handler: async (ctx) => {
		return await ctx.db.query("organizations").take(100);
	}
});

export const disputes = adminQuery({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("disputes"),
			bookingId: v.id("bookings"),
			eventName: v.string(),
			reason: v.string(),
			status: v.union(
				v.literal("open"),
				v.literal("resolved"),
				v.literal("rejected")
			),
			createdAt: v.number()
		})
	),
	handler: async (ctx) => {
		const items = await ctx.db
			.query("disputes")
			.withIndex("by_status", (q) => q.eq("status", "open"))
			.take(50);
		const result = [];
		for (const item of items) {
			const booking = await ctx.db.get(item.bookingId);
			result.push({
				_id: item._id,
				bookingId: item.bookingId,
				eventName: booking?.eventName ?? "Booking",
				reason: item.reason,
				status: item.status,
				createdAt: item.createdAt
			});
		}
		return result;
	}
});

export const resolveDispute = adminMutation({
	args: {
		disputeId: v.id("disputes"),
		status: v.union(v.literal("resolved"), v.literal("rejected"))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const dispute = await ctx.db.get(args.disputeId);
		if (!dispute) throw new Error("Dispute nicht gefunden");
		await ctx.db.patch(args.disputeId, {
			status: args.status,
			updatedAt: Date.now()
		});
		return null;
	}
});
