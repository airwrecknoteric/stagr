/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Generated locally until `npx convex dev` is connected to a deployment.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as admin from "../admin.js";
import type * as availability from "../availability.js";
import type * as bookings from "../bookings.js";
import type * as contracts from "../contracts.js";
import type * as djs from "../djs.js";
import type * as files from "../files.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as orgs from "../orgs.js";
import type * as payments from "../payments.js";
import type * as push from "../push.js";
import type * as reviews from "../reviews.js";
import type * as roster from "../roster.js";
import type * as search from "../search.js";
import type * as stripe from "../stripe.js";
import type * as stripeInternal from "../stripeInternal.js";
import type * as users from "../users.js";
import type * as venues from "../venues.js";

declare const fullApi: ApiFromModules<{
	admin: typeof admin;
	availability: typeof availability;
	bookings: typeof bookings;
	contracts: typeof contracts;
	djs: typeof djs;
	files: typeof files;
	messages: typeof messages;
	notifications: typeof notifications;
	orgs: typeof orgs;
	payments: typeof payments;
	push: typeof push;
	reviews: typeof reviews;
	roster: typeof roster;
	search: typeof search;
	stripe: typeof stripe;
	stripeInternal: typeof stripeInternal;
	users: typeof users;
	venues: typeof venues;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
