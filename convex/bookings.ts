import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { getActiveRosterForDj, notify, requireOrgBooker } from "./lib/auth";
import { bookingDoc, bookingStatus, disputeStatus } from "./lib/validators";

async function assertBookingAccess(
	ctx: (QueryCtx | MutationCtx) & { user: Doc<"users"> },
	bookingId: Id<"bookings">
) {
	const booking = await ctx.db.get(bookingId);
	if (!booking) throw new Error("Booking nicht gefunden");
	const dj = await ctx.db.get(booking.djProfileId);
	if (!dj) throw new Error("DJ nicht gefunden");

	if (booking.organizerUserId === ctx.user._id || dj.userId === ctx.user._id) {
		return { booking, dj };
	}

	if (booking.organizerOrgId) {
		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_org_and_user", (q) =>
				q.eq("organizationId", booking.organizerOrgId!).eq("userId", ctx.user._id)
			)
			.unique();
		if (membership) return { booking, dj };
	}

	if (booking.managementId) {
		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_org_and_user", (q) =>
				q.eq("organizationId", booking.managementId!).eq("userId", ctx.user._id)
			)
			.unique();
		if (membership) return { booking, dj };
	}

	throw new Error("Keine Berechtigung für dieses Booking");
}

export const create = authedMutation({
	args: {
		djProfileId: v.id("djProfiles"),
		organizerOrgId: v.optional(v.id("organizations")),
		venueId: v.optional(v.id("venues")),
		eventName: v.string(),
		eventDate: v.number(),
		setLengthMinutes: v.number(),
		venueName: v.string(),
		venueCity: v.string(),
		budgetMin: v.optional(v.number()),
		budgetMax: v.optional(v.number()),
		currency: v.optional(v.string()),
		message: v.string()
	},
	returns: v.id("bookings"),
	handler: async (ctx, args) => {
		if (args.eventName.trim().length < 2) {
			throw new Error("Eventname ist zu kurz");
		}
		if (args.organizerOrgId) {
			await requireOrgBooker(ctx, args.organizerOrgId, ctx.user._id);
		}
		const dj = await ctx.db.get(args.djProfileId);
		if (!dj || !dj.published) throw new Error("DJ nicht verfügbar");

		const roster = await getActiveRosterForDj(ctx, dj._id);
		const managementId = roster?.canNegotiate ? roster.managementId : undefined;
		const now = Date.now();

		const threadId = await ctx.db.insert("threads", {
			createdAt: now
		});

		const participantUserIds = new Set<Id<"users">>([ctx.user._id, dj.userId]);
		if (managementId) {
			const members = await ctx.db
				.query("memberships")
				.withIndex("by_org", (q) => q.eq("organizationId", managementId))
				.take(20);
			for (const member of members) {
				if (member.role !== "viewer") participantUserIds.add(member.userId);
			}
		}

		for (const userId of participantUserIds) {
			await ctx.db.insert("threadParticipants", {
				threadId,
				userId,
				organizationId:
					userId === ctx.user._id ? args.organizerOrgId : userId === dj.userId ? undefined : managementId,
				createdAt: now
			});
		}

		const bookingId = await ctx.db.insert("bookings", {
			organizerUserId: ctx.user._id,
			organizerOrgId: args.organizerOrgId,
			djProfileId: dj._id,
			managementId,
			venueId: args.venueId,
			eventName: args.eventName.trim(),
			eventDate: args.eventDate,
			setLengthMinutes: args.setLengthMinutes,
			venueName: args.venueName,
			venueCity: args.venueCity,
			budgetMin: args.budgetMin,
			budgetMax: args.budgetMax,
			currency: args.currency ?? "EUR",
			status: "requested",
			threadId,
			createdAt: now,
			updatedAt: now
		});

		await ctx.db.patch(threadId, { bookingId });

		if (args.message.trim().length > 0) {
			await ctx.db.insert("messages", {
				threadId,
				authorUserId: ctx.user._id,
				body: args.message.trim(),
				createdAt: now
			});
		}

		await notify(
			ctx,
			dj.userId,
			"Neue Booking-Anfrage",
			`${args.eventName} am ${new Date(args.eventDate).toLocaleDateString("de-DE")}`,
			`/app/bookings/${bookingId}`
		);
		if (managementId) {
			const members = await ctx.db
				.query("memberships")
				.withIndex("by_org", (q) => q.eq("organizationId", managementId))
				.take(10);
			for (const member of members) {
				if (member.role !== "viewer") {
					await notify(
						ctx,
						member.userId,
						"Neue Booking-Anfrage (Roster)",
						`${dj.stageName}: ${args.eventName}`,
						`/app/bookings/${bookingId}`
					);
				}
			}
		}
		return bookingId;
	}
});

export const listMine = authedQuery({
	args: {},
	returns: v.array(
		v.object({
			booking: bookingDoc,
			djName: v.string(),
			djSlug: v.string(),
			counterparty: v.string()
		})
	),
	handler: async (ctx) => {
		const asOrganizer = await ctx.db
			.query("bookings")
			.withIndex("by_organizer", (q) => q.eq("organizerUserId", ctx.user._id))
			.take(80);

		const dj = await ctx.db
			.query("djProfiles")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.unique();
		const asDj = dj
			? await ctx.db
					.query("bookings")
					.withIndex("by_dj", (q) => q.eq("djProfileId", dj._id))
					.take(80)
			: [];

		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.take(20);
		const asManagement = [];
		for (const membership of memberships) {
			const org = await ctx.db.get(membership.organizationId);
			if (org?.type !== "management") continue;
			const rows = await ctx.db
				.query("bookings")
				.withIndex("by_management", (q) => q.eq("managementId", org._id))
				.take(80);
			asManagement.push(...rows);
		}

		const all = [...asOrganizer, ...asDj, ...asManagement];
		const seen = new Set<string>();
		const result = [];
		for (const booking of all) {
			if (seen.has(booking._id)) continue;
			seen.add(booking._id);
			const profile = await ctx.db.get(booking.djProfileId);
			if (!profile) continue;
			const organizer = await ctx.db.get(booking.organizerUserId);
			result.push({
				booking,
				djName: profile.stageName,
				djSlug: profile.slug,
				counterparty:
					booking.organizerUserId === ctx.user._id
						? profile.stageName
						: (organizer?.name ?? "Veranstalter")
			});
		}
		result.sort((a, b) => b.booking.updatedAt - a.booking.updatedAt);
		return result;
	}
});

export const get = authedQuery({
	args: { bookingId: v.id("bookings") },
	returns: v.object({
		booking: bookingDoc,
		djName: v.string(),
		djSlug: v.string(),
		organizerName: v.string(),
		managementName: v.union(v.string(), v.null()),
		canActAsArtist: v.boolean(),
		canActAsOrganizer: v.boolean()
	}),
	handler: async (ctx, args) => {
		const { booking, dj } = await assertBookingAccess(ctx, args.bookingId);
		const organizer = await ctx.db.get(booking.organizerUserId);
		const management = booking.managementId
			? await ctx.db.get(booking.managementId)
			: null;
		const membership = booking.managementId
			? await ctx.db
					.query("memberships")
					.withIndex("by_org_and_user", (q) =>
						q.eq("organizationId", booking.managementId!).eq("userId", ctx.user._id)
					)
					.unique()
			: null;
		return {
			booking,
			djName: dj.stageName,
			djSlug: dj.slug,
			organizerName: organizer?.name ?? "Veranstalter",
			managementName: management?.name ?? null,
			canActAsArtist: dj.userId === ctx.user._id || Boolean(membership && membership.role !== "viewer"),
			canActAsOrganizer:
				booking.organizerUserId === ctx.user._id ||
				Boolean(
					booking.organizerOrgId &&
						(await ctx.db
							.query("memberships")
							.withIndex("by_org_and_user", (q) =>
								q
									.eq("organizationId", booking.organizerOrgId!)
									.eq("userId", ctx.user._id)
							)
							.unique())
				)
		};
	}
});

export const setStatus = authedMutation({
	args: {
		bookingId: v.id("bookings"),
		status: bookingStatus
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const { booking, dj } = await assertBookingAccess(ctx, args.bookingId);
		const isArtistSide =
			dj.userId === ctx.user._id ||
			(booking.managementId &&
				(await ctx.db
					.query("memberships")
					.withIndex("by_org_and_user", (q) =>
						q.eq("organizationId", booking.managementId!).eq("userId", ctx.user._id)
					)
					.unique()));
		const isOrganizer = booking.organizerUserId === ctx.user._id;

		if (args.status === "declined" && !isArtistSide) {
			throw new Error("Nur Artist/Management kann ablehnen");
		}
		if (args.status === "cancelled" && !isOrganizer && !isArtistSide) {
			throw new Error("Keine Berechtigung zum Absagen");
		}
		if (args.status === "completed" && booking.status !== "confirmed") {
			throw new Error("Nur bestätigte Bookings können abgeschlossen werden");
		}

		await ctx.db.patch(args.bookingId, {
			status: args.status,
			updatedAt: Date.now()
		});

		const recipient =
			ctx.user._id === booking.organizerUserId ? dj.userId : booking.organizerUserId;
		await notify(
			ctx,
			recipient,
			"Booking-Status",
			`${booking.eventName}: ${args.status}`,
			`/app/bookings/${booking._id}`
		);
		return null;
	}
});

export const createOffer = authedMutation({
	args: {
		bookingId: v.id("bookings"),
		fee: v.number(),
		currency: v.optional(v.string()),
		hospitality: v.optional(v.string()),
		setStart: v.optional(v.number()),
		setEnd: v.optional(v.number()),
		notes: v.optional(v.string())
	},
	returns: v.id("bookingOffers"),
	handler: async (ctx, args) => {
		if (args.fee <= 0) throw new Error("Fee muss größer als 0 sein");
		const { booking } = await assertBookingAccess(ctx, args.bookingId);
		const existing = await ctx.db
			.query("bookingOffers")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.take(50);
		const version = existing.length + 1;
		const offerId = await ctx.db.insert("bookingOffers", {
			bookingId: args.bookingId,
			authorUserId: ctx.user._id,
			fee: args.fee,
			currency: args.currency ?? booking.currency,
			hospitality: args.hospitality,
			setStart: args.setStart,
			setEnd: args.setEnd,
			notes: args.notes,
			version,
			createdAt: Date.now()
		});
		await ctx.db.patch(args.bookingId, {
			status: "offered",
			updatedAt: Date.now()
		});
		await ctx.db.insert("messages", {
			threadId: booking.threadId,
			authorUserId: ctx.user._id,
			body: `Angebot v${version}: ${args.fee} ${args.currency ?? booking.currency}${args.notes ? ` — ${args.notes}` : ""}`,
			createdAt: Date.now()
		});
		return offerId;
	}
});

export const acceptOffer = authedMutation({
	args: { bookingId: v.id("bookings") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const { booking } = await assertBookingAccess(ctx, args.bookingId);
		if (booking.status !== "offered") {
			throw new Error("Es liegt kein offenes Angebot vor");
		}
		await ctx.db.patch(args.bookingId, {
			status: "confirmed",
			updatedAt: Date.now()
		});
		await ctx.db.insert("messages", {
			threadId: booking.threadId,
			authorUserId: ctx.user._id,
			body: "Angebot angenommen. Booking bestätigt.",
			createdAt: Date.now()
		});
		return null;
	}
});

export const listOffers = authedQuery({
	args: { bookingId: v.id("bookings") },
	returns: v.array(
		v.object({
			_id: v.id("bookingOffers"),
			fee: v.number(),
			currency: v.string(),
			hospitality: v.optional(v.string()),
			setStart: v.optional(v.number()),
			setEnd: v.optional(v.number()),
			notes: v.optional(v.string()),
			version: v.number(),
			authorUserId: v.id("users"),
			createdAt: v.number()
		})
	),
	handler: async (ctx, args) => {
		await assertBookingAccess(ctx, args.bookingId);
		const offers = await ctx.db
			.query("bookingOffers")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.take(50);
		return offers.map((offer) => ({
			_id: offer._id,
			fee: offer.fee,
			currency: offer.currency,
			hospitality: offer.hospitality,
			setStart: offer.setStart,
			setEnd: offer.setEnd,
			notes: offer.notes,
			version: offer.version,
			authorUserId: offer.authorUserId,
			createdAt: offer.createdAt
		}));
	}
});

export const openDispute = authedMutation({
	args: {
		bookingId: v.id("bookings"),
		reason: v.string()
	},
	returns: v.id("disputes"),
	handler: async (ctx, args) => {
		const reason = args.reason.trim();
		if (reason.length < 8) {
			throw new Error("Bitte beschreibe den Dispute genauer");
		}
		const { booking, dj } = await assertBookingAccess(ctx, args.bookingId);
		const existing = await ctx.db
			.query("disputes")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.take(10);
		if (existing.some((item) => item.status === "open")) {
			throw new Error("Es gibt bereits einen offenen Dispute");
		}
		const disputeId = await ctx.db.insert("disputes", {
			bookingId: args.bookingId,
			openedBy: ctx.user._id,
			reason,
			status: "open",
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
		const recipient =
			ctx.user._id === booking.organizerUserId ? dj.userId : booking.organizerUserId;
		await notify(
			ctx,
			recipient,
			"Dispute eröffnet",
			`${booking.eventName}: ${reason}`,
			`/app/bookings/${booking._id}`
		);
		return disputeId;
	}
});

export const listDisputes = authedQuery({
	args: { bookingId: v.id("bookings") },
	returns: v.array(
		v.object({
			_id: v.id("disputes"),
			reason: v.string(),
			status: disputeStatus,
			createdAt: v.number()
		})
	),
	handler: async (ctx, args) => {
		await assertBookingAccess(ctx, args.bookingId);
		const items = await ctx.db
			.query("disputes")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.take(20);
		return items.map((item) => ({
			_id: item._id,
			reason: item.reason,
			status: item.status,
			createdAt: item.createdAt
		}));
	}
});
