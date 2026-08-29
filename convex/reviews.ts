import { v } from "convex/values";
import { query } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";

export const listForDj = query({
	args: { djProfileId: v.id("djProfiles") },
	returns: v.object({
		average: v.union(v.number(), v.null()),
		count: v.number(),
		items: v.array(
			v.object({
				_id: v.id("reviews"),
				rating: v.number(),
				text: v.string(),
				createdAt: v.number()
			})
		)
	}),
	handler: async (ctx, args) => {
		const items = await ctx.db
			.query("reviews")
			.withIndex("by_dj", (q) => q.eq("toDjProfileId", args.djProfileId))
			.take(50);
		const ratings = items.map((item) => item.rating);
		const average =
			ratings.length > 0 ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length : null;
		return {
			average,
			count: ratings.length,
			items: items.map((item) => ({
				_id: item._id,
				rating: item.rating,
				text: item.text,
				createdAt: item.createdAt
			}))
		};
	}
});

export const create = authedMutation({
	args: {
		bookingId: v.id("bookings"),
		rating: v.number(),
		text: v.string(),
		target: v.union(v.literal("dj"), v.literal("organizer"))
	},
	returns: v.id("reviews"),
	handler: async (ctx, args) => {
		if (args.rating < 1 || args.rating > 5) {
			throw new Error("Bewertung muss zwischen 1 und 5 liegen");
		}
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking nicht gefunden");
		if (booking.status !== "completed") {
			throw new Error("Reviews nur nach abgeschlossenem Booking");
		}
		const existing = await ctx.db
			.query("reviews")
			.withIndex("by_booking_and_from", (q) =>
				q.eq("bookingId", args.bookingId).eq("fromUserId", ctx.user._id)
			)
			.unique();
		if (existing) throw new Error("Du hast bereits bewertet");

		const dj = await ctx.db.get(booking.djProfileId);
		if (!dj) throw new Error("DJ nicht gefunden");

		if (args.target === "dj") {
			if (ctx.user._id !== booking.organizerUserId) {
				throw new Error("Nur der Veranstalter kann den DJ bewerten");
			}
			return await ctx.db.insert("reviews", {
				bookingId: args.bookingId,
				fromUserId: ctx.user._id,
				toUserId: dj.userId,
				toDjProfileId: dj._id,
				rating: args.rating,
				text: args.text,
				createdAt: Date.now()
			});
		}

		if (dj.userId !== ctx.user._id) {
			throw new Error("Nur der DJ kann den Veranstalter bewerten");
		}
		return await ctx.db.insert("reviews", {
			bookingId: args.bookingId,
			fromUserId: ctx.user._id,
			toUserId: booking.organizerUserId,
			toOrgId: booking.organizerOrgId,
			rating: args.rating,
			text: args.text,
			createdAt: Date.now()
		});
	}
});

export const mineForBooking = authedQuery({
	args: { bookingId: v.id("bookings") },
	returns: v.union(
		v.object({
			_id: v.id("reviews"),
			rating: v.number(),
			text: v.string()
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("reviews")
			.withIndex("by_booking_and_from", (q) =>
				q.eq("bookingId", args.bookingId).eq("fromUserId", ctx.user._id)
			)
			.unique();
		if (!existing) return null;
		return { _id: existing._id, rating: existing.rating, text: existing.text };
	}
});
