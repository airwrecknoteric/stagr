"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

function getStripe() {
	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) throw new Error("STRIPE_SECRET_KEY fehlt");
	return new Stripe(key);
}

function platformFeePercent() {
	return Number(process.env.PLATFORM_FEE_PERCENT ?? 10);
}

export const createConnectLink = action({
	args: {
		organizationId: v.optional(v.id("organizations")),
		returnUrl: v.string()
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Nicht angemeldet");
		const stripe = getStripe();
		const user = await ctx.runQuery(internal.stripeInternal.getPayoutTarget, {
			organizationId: args.organizationId
		});
		let accountId = user.stripeAccountId;
		if (!accountId) {
			const account = await stripe.accounts.create({
				type: "express",
				email: user.email,
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true }
				}
			});
			accountId = account.id;
			await ctx.runMutation(internal.users.setStripeAccount, {
				userId: user.userId,
				organizationId: args.organizationId,
				stripeAccountId: accountId,
				ready: false
			});
		}
		const link = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: args.returnUrl,
			return_url: args.returnUrl,
			type: "account_onboarding"
		});
		return link.url;
	}
});

export const createCheckout = action({
	args: {
		bookingId: v.id("bookings"),
		kind: v.union(v.literal("deposit"), v.literal("remainder")),
		successUrl: v.string(),
		cancelUrl: v.string()
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Nicht angemeldet");
		const stripe = getStripe();
		const details = await ctx.runQuery(internal.stripeInternal.getCheckoutDetails, {
			bookingId: args.bookingId
		});
		if (!details.connectedAccountId) {
			throw new Error("Artist/Management hat Stripe Connect noch nicht eingerichtet");
		}
		const feePercent = platformFeePercent();
		const amount = args.kind === "deposit" ? Math.round(details.fee * 0.3) : Math.round(details.fee * 0.7);
		const platformFee = Math.round((amount * feePercent) / 100);

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			success_url: args.successUrl,
			cancel_url: args.cancelUrl,
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency: details.currency.toLowerCase(),
						unit_amount: amount,
						product_data: {
							name: `${args.kind === "deposit" ? "Anzahlung" : "Restzahlung"}: ${details.eventName}`
						}
					}
				}
			],
			payment_intent_data: {
				application_fee_amount: platformFee,
				transfer_data: {
					destination: details.connectedAccountId
				},
				metadata: {
					bookingId: args.bookingId,
					kind: args.kind
				}
			},
			metadata: {
				bookingId: args.bookingId,
				kind: args.kind
			}
		});

		await ctx.runMutation(internal.payments.upsertFromStripe, {
			bookingId: args.bookingId,
			kind: args.kind,
			amount,
			currency: details.currency,
			platformFee,
			stripeCheckoutSessionId: session.id,
			status: "pending"
		});

		if (!session.url) throw new Error("Checkout-URL fehlt");
		return session.url;
	}
});

export const handleWebhook = internalAction({
	args: {
		body: v.string(),
		signature: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const stripe = getStripe();
		const secret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET fehlt");
		const event = stripe.webhooks.constructEvent(args.body, args.signature, secret);

		if (event.type === "checkout.session.completed") {
			const session = event.data.object;
			const bookingId = session.metadata?.bookingId as typeof session.metadata extends infer M
				? M extends { bookingId: string }
					? string
					: string
				: string;
			const kind = (session.metadata?.kind ?? "deposit") as "deposit" | "remainder";
			if (bookingId) {
				await ctx.runMutation(internal.payments.upsertFromStripe, {
					bookingId: bookingId as never,
					kind,
					amount: session.amount_total ?? 0,
					currency: (session.currency ?? "eur").toUpperCase(),
					platformFee:
						"application_fee_amount" in session && typeof session.application_fee_amount === "number"
							? session.application_fee_amount
							: 0,
					stripeCheckoutSessionId: session.id,
					stripePaymentIntentId:
						typeof session.payment_intent === "string" ? session.payment_intent : undefined,
					status: "paid"
				});
			}
		}

		if (event.type === "account.updated") {
			const account = event.data.object;
			await ctx.runMutation(internal.stripeInternal.markAccountReady, {
				stripeAccountId: account.id,
				ready: Boolean(account.charges_enabled && account.payouts_enabled)
			});
		}
		return null;
	}
});
