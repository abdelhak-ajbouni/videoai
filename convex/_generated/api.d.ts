/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as creditPackages from "../creditPackages.js";
import type * as credits from "../credits.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as pricing from "../pricing.js";
import type * as stripe from "../stripe.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as videos from "../videos.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  creditPackages: typeof creditPackages;
  credits: typeof credits;
  http: typeof http;
  migrations: typeof migrations;
  pricing: typeof pricing;
  stripe: typeof stripe;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptions: typeof subscriptions;
  users: typeof users;
  videos: typeof videos;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
