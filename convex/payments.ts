import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { onboardedQuery } from './lib/customFunctions';
import { paymentKind, paymentStatus } from './lib/validators';

export const listForBooking = onboardedQuery({
	args: { bookingId: v.id('bookings') },
	returns: v.array(
		v.object({
			_id: v.id('payments'),
			kind: paymentKind,
			amount: v.number(),
			currency: v.string(),
			platformFee: v.number(),
			status: paymentStatus,
			createdAt: v.number()
		})
	),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error('Booking nicht gefunden');
		const participant = await ctx.db
			.query('threadParticipants')
			.withIndex('by_thread_and_user', (q) =>
				q.eq('threadId', booking.threadId).eq('userId', ctx.user._id)
			)
			.unique();
		if (!participant) throw new Error('Keine Berechtigung');
		const payments = await ctx.db
			.query('payments')
			.withIndex('by_booking', (q) => q.eq('bookingId', args.bookingId))
			.take(10);
		return payments.map((payment) => ({
			_id: payment._id,
			kind: payment.kind,
			amount: payment.amount,
			currency: payment.currency,
			platformFee: payment.platformFee,
			status: payment.status,
			createdAt: payment.createdAt
		}));
	}
});

export const upsertFromStripe = internalMutation({
	args: {
		bookingId: v.id('bookings'),
		kind: paymentKind,
		amount: v.number(),
		currency: v.string(),
		platformFee: v.number(),
		stripeCheckoutSessionId: v.string(),
		stripePaymentIntentId: v.optional(v.string()),
		status: paymentStatus
	},
	returns: v.id('payments'),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('payments')
			.withIndex('by_session', (q) => q.eq('stripeCheckoutSessionId', args.stripeCheckoutSessionId))
			.unique();
		const now = Date.now();
		if (existing) {
			await ctx.db.patch(existing._id, {
				status: args.status,
				stripePaymentIntentId: args.stripePaymentIntentId,
				updatedAt: now
			});
			return existing._id;
		}
		return await ctx.db.insert('payments', {
			bookingId: args.bookingId,
			kind: args.kind,
			amount: args.amount,
			currency: args.currency,
			platformFee: args.platformFee,
			stripeCheckoutSessionId: args.stripeCheckoutSessionId,
			stripePaymentIntentId: args.stripePaymentIntentId,
			status: args.status,
			createdAt: now,
			updatedAt: now
		});
	}
});
