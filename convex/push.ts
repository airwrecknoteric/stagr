"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const sendToUser = internalAction({
	args: {
		userId: v.id("users"),
		title: v.string(),
		body: v.string(),
		href: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const key = process.env.FCM_SERVER_KEY;
		if (!key) return null;

		const target = await ctx.runQuery(internal.users.getPushTarget, {
			userId: args.userId
		});
		for (const token of target.tokens) {
			const response = await fetch("https://fcm.googleapis.com/fcm/send", {
				method: "POST",
				headers: {
					Authorization: `key=${key}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					to: token,
					notification: {
						title: args.title,
						body: args.body
					},
					data: {
						href: args.href ?? "/app/inbox"
					}
				})
			});
			if (!response.ok) {
				console.error("FCM send failed", await response.text());
			}
		}
		return null;
	}
});
