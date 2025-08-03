/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as configurations from "../configurations.js";
import type * as creditPackages from "../creditPackages.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as lib_replicateClient from "../lib/replicateClient.js";
import type * as lib_validation from "../lib/validation.js";
import type * as migrations from "../migrations.js";
import type * as modelParameterHelpers from "../modelParameterHelpers.js";
import type * as models from "../models.js";
import type * as pricing from "../pricing.js";
import type * as r2 from "../r2.js";
import type * as simpleModelHelpers from "../simpleModelHelpers.js";
import type * as stripe from "../stripe.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptions from "../subscriptions.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as videos from "../videos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

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
  "lib/validation": typeof lib_validation;
  migrations: typeof migrations;
  modelParameterHelpers: typeof modelParameterHelpers;
  models: typeof models;
  pricing: typeof pricing;
  r2: typeof r2;
  simpleModelHelpers: typeof simpleModelHelpers;
  stripe: typeof stripe;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptions: typeof subscriptions;
  userProfiles: typeof userProfiles;
  users: typeof users;
  videos: typeof videos;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  r2: {
    lib: {
      deleteMetadata: FunctionReference<
        "mutation",
        "internal",
        { bucket: string; key: string },
        null
      >;
      deleteObject: FunctionReference<
        "mutation",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        null
      >;
      deleteR2Object: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        null
      >;
      getMetadata: FunctionReference<
        "query",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        {
          bucket: string;
          bucketLink: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
          url: string;
        } | null
      >;
      listMetadata: FunctionReference<
        "query",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          cursor?: string;
          endpoint: string;
          limit?: number;
          secretAccessKey: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            bucket: string;
            bucketLink: string;
            contentType?: string;
            key: string;
            lastModified: string;
            link: string;
            sha256?: string;
            size?: number;
            url: string;
          }>;
          pageStatus?: null | "SplitRecommended" | "SplitRequired";
          splitCursor?: null | string;
        }
      >;
      store: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          secretAccessKey: string;
          url: string;
        },
        any
      >;
      syncMetadata: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          onComplete?: string;
          secretAccessKey: string;
        },
        null
      >;
      upsertMetadata: FunctionReference<
        "mutation",
        "internal",
        {
          bucket: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
        },
        { isNew: boolean }
      >;
    };
  };
};
