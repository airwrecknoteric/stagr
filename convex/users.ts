import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getCurrentUserOrNull, isAdminEmail } from "./lib/auth";
import { userDoc } from "./lib/validators";

export const store = mutation({
	args: {},
	returns: v.id("users"),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Nicht angemeldet");
		}

		const now = Date.now();
		const email = identity.email ?? `${identity.subject}@clerk.local`;
		const name = identity.name ?? identity.nickname ?? email.split("@")[0] ?? "Nutzer";
		const clerkUserId = identity.subject;
		const isAdmin = isAdminEmail(email);

		const existingByToken = await ctx.db
			.query("users")
			.withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique();

		if (existingByToken) {
			await ctx.db.patch(existingByToken._id, {
				name,
				email,
				pictureUrl: identity.pictureUrl,
				clerkUserId,
				isAdmin: existingByToken.isAdmin || isAdmin,
				updatedAt: now
			});
			return existingByToken._id;
		}

		const existingByClerk = await ctx.db
			.query("users")
			.withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
			.unique();

		if (existingByClerk) {
			await ctx.db.patch(existingByClerk._id, {
				tokenIdentifier: identity.tokenIdentifier,
				name,
				email,
				pictureUrl: identity.pictureUrl,
				isAdmin: existingByClerk.isAdmin || isAdmin,
				updatedAt: now
			});
			return existingByClerk._id;
		}

		return await ctx.db.insert("users", {
			tokenIdentifier: identity.tokenIdentifier,
			clerkUserId,
			name,
			email,
			pictureUrl: identity.pictureUrl,
			onboardingCompleted: false,
			isAdmin,
			createdAt: now,
			updatedAt: now
		});
	}
});

export const me = query({
	args: {},
	returns: v.union(userDoc, v.null()),
	handler: async (ctx) => {
		return await getCurrentUserOrNull(ctx);
	}
});

export const completeOnboarding = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Nicht angemeldet");
		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique();
		if (!user) throw new Error("Benutzer nicht gefunden");
		await ctx.db.patch(user._id, {
			onboardingCompleted: true,
			updatedAt: Date.now()
		});
		return null;
	}
});

export const registerPushToken = mutation({
	args: { token: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Nicht angemeldet");
		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
			.unique();
		if (!user) throw new Error("Benutzer nicht gefunden");
		const tokens = new Set(user.pushTokens ?? []);
		tokens.add(args.token);
		await ctx.db.patch(user._id, {
			pushTokens: [...tokens],
			updatedAt: Date.now()
		});
		return null;
	}
});

export const setStripeAccount = internalMutation({
	args: {
		userId: v.optional(v.id("users")),
		organizationId: v.optional(v.id("organizations")),
		stripeAccountId: v.string(),
		ready: v.boolean()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		if (args.userId) {
			await ctx.db.patch(args.userId, {
				stripeAccountId: args.stripeAccountId,
				stripeAccountReady: args.ready,
				updatedAt: Date.now()
			});
		}
		if (args.organizationId) {
			await ctx.db.patch(args.organizationId, {
				stripeAccountId: args.stripeAccountId,
				stripeAccountReady: args.ready,
				updatedAt: Date.now()
			});
		}
		return null;
	}
});

export const getPushTarget = internalQuery({
	args: { userId: v.id("users") },
	returns: v.object({ tokens: v.array(v.string()) }),
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		return { tokens: user?.pushTokens ?? [] };
	}
});
