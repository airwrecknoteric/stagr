import {
	customMutation,
	customQuery
} from "convex-helpers/server/customFunctions";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
	getCurrentUser,
	requireAdmin,
	requireOrgBooker,
	requireOrgMember
} from "./auth";

export const authedQuery = customQuery(query, {
	args: {},
	input: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		return { ctx: { ...ctx, user }, args };
	}
});

export const authedMutation = customMutation(mutation, {
	args: {},
	input: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		return { ctx: { ...ctx, user }, args };
	}
});

export const adminQuery = customQuery(query, {
	args: {},
	input: async (ctx, args) => {
		const user = await requireAdmin(ctx);
		return { ctx: { ...ctx, user }, args };
	}
});

export const adminMutation = customMutation(mutation, {
	args: {},
	input: async (ctx, args) => {
		const user = await requireAdmin(ctx);
		return { ctx: { ...ctx, user }, args };
	}
});

export const orgQuery = customQuery(query, {
	args: { organizationId: v.id("organizations") },
	input: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const membership = await requireOrgMember(ctx, args.organizationId, user._id);
		return {
			ctx: { ...ctx, user, organizationId: args.organizationId, membership },
			args
		};
	}
});

export const orgMutation = customMutation(mutation, {
	args: { organizationId: v.id("organizations") },
	input: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const membership = await requireOrgBooker(ctx, args.organizationId, user._id);
		return {
			ctx: { ...ctx, user, organizationId: args.organizationId, membership },
			args
		};
	}
});
