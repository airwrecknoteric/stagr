import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { onboardedMutation, onboardedQuery } from './lib/customFunctions';

const messageDoc = v.object({
	_id: v.id('messages'),
	_creationTime: v.number(),
	threadId: v.id('threads'),
	authorUserId: v.id('users'),
	body: v.string(),
	fileStorageId: v.optional(v.id('_storage')),
	fileName: v.optional(v.string()),
	createdAt: v.number()
});

export const list = onboardedQuery({
	args: {
		threadId: v.id('threads'),
		paginationOpts: paginationOptsValidator
	},
	returns: v.object({
		page: v.array(messageDoc),
		isDone: v.boolean(),
		continueCursor: v.string()
	}),
	handler: async (ctx, args) => {
		const participant = await ctx.db
			.query('threadParticipants')
			.withIndex('by_thread_and_user', (q) =>
				q.eq('threadId', args.threadId).eq('userId', ctx.user._id)
			)
			.unique();
		if (!participant) throw new Error('Kein Zugriff auf diesen Thread');

		return await ctx.db
			.query('messages')
			.withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
			.order('desc')
			.paginate(args.paginationOpts);
	}
});

export const send = onboardedMutation({
	args: {
		threadId: v.id('threads'),
		body: v.string(),
		fileStorageId: v.optional(v.id('_storage')),
		fileName: v.optional(v.string())
	},
	returns: v.id('messages'),
	handler: async (ctx, args) => {
		const participant = await ctx.db
			.query('threadParticipants')
			.withIndex('by_thread_and_user', (q) =>
				q.eq('threadId', args.threadId).eq('userId', ctx.user._id)
			)
			.unique();
		if (!participant) throw new Error('Kein Zugriff auf diesen Thread');
		if (args.body.trim().length === 0 && !args.fileStorageId) {
			throw new Error('Nachricht darf nicht leer sein');
		}
		return await ctx.db.insert('messages', {
			threadId: args.threadId,
			authorUserId: ctx.user._id,
			body: args.body.trim(),
			fileStorageId: args.fileStorageId,
			fileName: args.fileName,
			createdAt: Date.now()
		});
	}
});

export const inbox = onboardedQuery({
	args: {},
	returns: v.array(
		v.object({
			threadId: v.id('threads'),
			bookingId: v.union(v.id('bookings'), v.null()),
			eventName: v.string(),
			preview: v.string(),
			updatedAt: v.number(),
			status: v.optional(v.string())
		})
	),
	handler: async (ctx) => {
		const parts = await ctx.db
			.query('threadParticipants')
			.withIndex('by_user', (q) => q.eq('userId', ctx.user._id))
			.take(80);
		const rows = [];
		for (const part of parts) {
			const thread = await ctx.db.get(part.threadId);
			if (!thread) continue;
			const booking = thread.bookingId ? await ctx.db.get(thread.bookingId) : null;
			const last = await ctx.db
				.query('messages')
				.withIndex('by_thread', (q) => q.eq('threadId', part.threadId))
				.order('desc')
				.take(1);
			const lastMessage = last[0];
			rows.push({
				threadId: part.threadId,
				bookingId: thread.bookingId ?? null,
				eventName: booking?.eventName ?? 'Nachricht',
				preview: lastMessage?.body ?? 'Noch keine Nachrichten',
				updatedAt: lastMessage?.createdAt ?? thread.createdAt,
				status: booking?.status
			});
		}
		rows.sort((a, b) => b.updatedAt - a.updatedAt);
		return rows;
	}
});
