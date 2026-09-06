/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as availability from "../availability.js";
import type * as bookings from "../bookings.js";
import type * as contracts from "../contracts.js";
import type * as djs from "../djs.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_geo from "../lib/geo.js";
import type * as lib_validators from "../lib/validators.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
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

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  availability: typeof availability;
  bookings: typeof bookings;
  contracts: typeof contracts;
  djs: typeof djs;
  files: typeof files;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/geo": typeof lib_geo;
  "lib/validators": typeof lib_validators;
  messages: typeof messages;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
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
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
