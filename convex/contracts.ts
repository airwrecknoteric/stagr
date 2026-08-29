import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";

export const list = authedQuery({
	args: { bookingId: v.id("bookings") },
	returns: v.array(
		v.object({
			_id: v.id("contracts"),
			fileName: v.string(),
			url: v.union(v.string(), v.null()),
			signedByOrganizer: v.boolean(),
			signedByArtist: v.boolean(),
			createdAt: v.number()
		})
	),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking nicht gefunden");
		const participant = await ctx.db
			.query("threadParticipants")
			.withIndex("by_thread_and_user", (q) =>
				q.eq("threadId", booking.threadId).eq("userId", ctx.user._id)
			)
			.unique();
		if (!participant) throw new Error("Keine Berechtigung");
		const contracts = await ctx.db
			.query("contracts")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.take(20);
		const rows = [];
		for (const contract of contracts) {
			rows.push({
				_id: contract._id,
				fileName: contract.fileName,
				url: await ctx.storage.getUrl(contract.storageId),
				signedByOrganizer: contract.signedByOrganizer,
				signedByArtist: contract.signedByArtist,
				createdAt: contract.createdAt
			});
		}
		return rows;
	}
});

export const upload = authedMutation({
	args: {
		bookingId: v.id("bookings"),
		storageId: v.id("_storage"),
		fileName: v.string()
	},
	returns: v.id("contracts"),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking nicht gefunden");
		const participant = await ctx.db
			.query("threadParticipants")
			.withIndex("by_thread_and_user", (q) =>
				q.eq("threadId", booking.threadId).eq("userId", ctx.user._id)
			)
			.unique();
		if (!participant) throw new Error("Keine Berechtigung");
		return await ctx.db.insert("contracts", {
			bookingId: args.bookingId,
			storageId: args.storageId,
			fileName: args.fileName,
			uploadedBy: ctx.user._id,
			signedByOrganizer: false,
			signedByArtist: false,
			createdAt: Date.now()
		});
	}
});

export const markSigned = authedMutation({
	args: {
		contractId: v.id("contracts"),
		side: v.union(v.literal("organizer"), v.literal("artist"))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const contract = await ctx.db.get(args.contractId);
		if (!contract) throw new Error("Vertrag nicht gefunden");
		const booking = await ctx.db.get(contract.bookingId);
		if (!booking) throw new Error("Booking nicht gefunden");
		if (args.side === "organizer") {
			await ctx.db.patch(args.contractId, { signedByOrganizer: true });
		} else {
			await ctx.db.patch(args.contractId, { signedByArtist: true });
		}
		return null;
	}
});
