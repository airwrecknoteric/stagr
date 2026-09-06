import { v } from 'convex/values';
import { onboardedMutation } from './lib/customFunctions';

export const generateUploadUrl = onboardedMutation({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	}
});

export const getUrl = onboardedMutation({
	args: { storageId: v.id('_storage') },
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.storageId);
	}
});
