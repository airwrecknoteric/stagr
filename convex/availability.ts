import { v } from 'convex/values';
import { onboardedMutation, onboardedQuery } from './lib/customFunctions';

export const list = onboardedQuery({
	args: { djProfileId: v.id('djProfiles') },
	returns: v.array(
		v.object({
			_id: v.id('availability'),
			start: v.number(),
			end: v.number(),
			kind: v.union(v.literal('busy'), v.literal('free')),
			note: v.optional(v.string())
		})
	),
	handler: async (ctx, args) => {
		const blocks = await ctx.db
			.query('availability')
			.withIndex('by_dj', (q) => q.eq('djProfileId', args.djProfileId))
			.take(200);
		return blocks.map((block) => ({
			_id: block._id,
			start: block.start,
			end: block.end,
			kind: block.kind,
			note: block.note
		}));
	}
});

export const add = onboardedMutation({
	args: {
		start: v.number(),
		end: v.number(),
		kind: v.union(v.literal('busy'), v.literal('free')),
		note: v.optional(v.string())
	},
	returns: v.id('availability'),
	handler: async (ctx, args) => {
		if (args.end <= args.start) throw new Error('Zeitraum ist ungültig');
		const profile = await ctx.db
			.query('djProfiles')
			.withIndex('by_user', (q) => q.eq('userId', ctx.user._id))
			.unique();
		if (!profile) throw new Error('DJ-Profil nicht gefunden');
		return await ctx.db.insert('availability', {
			djProfileId: profile._id,
			start: args.start,
			end: args.end,
			kind: args.kind,
			note: args.note,
			createdAt: Date.now()
		});
	}
});

export const remove = onboardedMutation({
	args: { id: v.id('availability') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const block = await ctx.db.get(args.id);
		if (!block) throw new Error('Eintrag nicht gefunden');
		const profile = await ctx.db.get(block.djProfileId);
		if (!profile || profile.userId !== ctx.user._id) {
			throw new Error('Keine Berechtigung');
		}
		await ctx.db.delete(args.id);
		return null;
	}
});
