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
import type * as configurations from "../configurations.js";
import type * as creditPackages from "../creditPackages.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as lib_replicateClient from "../lib/replicateClient.js";
import type * as migrations from "../migrations.js";
import type * as models from "../models.js";
import type * as pricing from "../pricing.js";
import type * as stripe from "../stripe.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptions from "../subscriptions.js";
import type * as userProfiles from "../userProfiles.js";
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
  configurations: typeof configurations;
  creditPackages: typeof creditPackages;
  http: typeof http;
  init: typeof init;
  "lib/replicateClient": typeof lib_replicateClient;
  migrations: typeof migrations;
  models: typeof models;
  pricing: typeof pricing;
  stripe: typeof stripe;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptions: typeof subscriptions;
  userProfiles: typeof userProfiles;
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
