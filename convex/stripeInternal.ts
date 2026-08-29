import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const getPayoutTarget = internalQuery({
	args: { organizationId: v.optional(v.id("organizations")) },
	returns: v.object({
		userId: v.id("users"),
		email: v.string(),
		stripeAccountId: v.optional(v.string())
	}),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (args.organizationId) {
			const org = await ctx.db.get(args.organizationId);
			if (!org) throw new Error("Organisation nicht gefunden");
			return {
				userId: user._id,
				email: user.email,
				stripeAccountId: org.stripeAccountId ?? user.stripeAccountId
			};
		}
		return {
			userId: user._id,
			email: user.email,
			stripeAccountId: user.stripeAccountId
		};
	}
});

export const getCheckoutDetails = internalQuery({
	args: { bookingId: v.id("bookings") },
	returns: v.object({
		eventName: v.string(),
		fee: v.number(),
		currency: v.string(),
		connectedAccountId: v.union(v.string(), v.null())
	}),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking nicht gefunden");
		if (booking.status !== "confirmed") {
			throw new Error("Zahlung nur für bestätigte Bookings");
		}
		const offers = await ctx.db
			.query("bookingOffers")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.take(50);
		const latest = offers.at(-1);
		if (!latest) throw new Error("Kein Angebot vorhanden");

		let connectedAccountId: string | null = null;
		if (booking.managementId) {
			const org = await ctx.db.get(booking.managementId);
			connectedAccountId = org?.stripeAccountId ?? null;
		}
		if (!connectedAccountId) {
			const dj = await ctx.db.get(booking.djProfileId);
			if (dj) {
				const artist = await ctx.db.get(dj.userId);
				connectedAccountId = artist?.stripeAccountId ?? null;
			}
		}

		return {
			eventName: booking.eventName,
			fee: Math.round(latest.fee * 100),
			currency: latest.currency,
			connectedAccountId
		};
	}
});

export const markAccountReady = internalMutation({
	args: {
		stripeAccountId: v.string(),
		ready: v.boolean()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const users = await ctx.db.query("users").take(200);
		for (const user of users) {
			if (user.stripeAccountId === args.stripeAccountId) {
				await ctx.db.patch(user._id, {
					stripeAccountReady: args.ready,
					updatedAt: Date.now()
				});
			}
		}
		const orgs = await ctx.db.query("organizations").take(200);
		for (const org of orgs) {
			if (org.stripeAccountId === args.stripeAccountId) {
				await ctx.db.patch(org._id, {
					stripeAccountReady: args.ready,
					updatedAt: Date.now()
				});
			}
		}
		return null;
	}
});
