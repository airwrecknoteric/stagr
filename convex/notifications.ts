import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";

export const list = authedQuery({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("notifications"),
			title: v.string(),
			body: v.string(),
			href: v.optional(v.string()),
			read: v.boolean(),
			createdAt: v.number()
		})
	),
	handler: async (ctx) => {
		const items = await ctx.db
			.query("notifications")
			.withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
			.order("desc")
			.take(50);
		return items.map((item) => ({
			_id: item._id,
			title: item.title,
			body: item.body,
			href: item.href,
			read: item.read,
			createdAt: item.createdAt
		}));
	}
});

export const unreadCount = authedQuery({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_user_and_read", (q) => q.eq("userId", ctx.user._id).eq("read", false))
			.take(50);
		return unread.length;
	}
});

export const markRead = authedMutation({
	args: { id: v.optional(v.id("notifications")) },
	returns: v.null(),
	handler: async (ctx, args) => {
		if (args.id) {
			const item = await ctx.db.get(args.id);
			if (item && item.userId === ctx.user._id) {
				await ctx.db.patch(args.id, { read: true });
			}
			return null;
		}
		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_user_and_read", (q) => q.eq("userId", ctx.user._id).eq("read", false))
			.take(50);
		for (const item of unread) {
			await ctx.db.patch(item._id, { read: true });
		}
		return null;
	}
});
