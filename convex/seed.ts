/**
 * DATABASE SEED SCRIPT
 *
 * This file is responsible for seeding the database with initial data.
 * It should ONLY be used for:
 * - Populating lookup tables with default data
 * - Fresh database initialization
 *
 * This is NOT for migrations or data transformations.
 */

import { Doc } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";

// Default AI models data
const defaultModels = [
  {
    modelId: "hailuo_02",
    name: "Budget Model",
    description: "Affordable AI video generation with good quality",
    modelType: "hailuo",
    replicateModelId: "minimax/hailuo-02",
    isActive: true,
    isPremium: false,
    isDefault: true,
  },
  {
    modelId: "seedance_pro",
    name: "Advanced Model",
    description: "High-quality AI video generation with advanced features",
    modelType: "seedance",
    replicateModelId: "bytedance/seedance-1-pro",
    isActive: true,
    isPremium: true,
    isDefault: false,
  },
  {
    modelId: "veo_3",
    name: "Flagship Model",
    description: "Premium AI videos generation with Audio support",
    modelType: "google_veo",
    replicateModelId: "google/veo-3",
    isActive: true,
    isPremium: true,
    isDefault: false,
  },
];

// Default credit packages data
const defaultPackages = [
  {
    packageId: "small",
    name: "Small",
    description: "Quick credit top-up",
    price: 699, // $6.99
    currency: "usd",
    credits: 500,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "medium",
    name: "Medium",
    description: "Great value package",
    price: 2999, // $29.99
    currency: "usd",
    credits: 2500,
    isActive: true,
    isPopular: true,
  },
  {
    packageId: "large",
    name: "Large",
    description: "Maximum value package",
    price: 9499, // $94.99
    currency: "usd",
    credits: 8000,
    isActive: true,
    isPopular: false,
  },
];

// Default subscription plans data
const defaultPlans = [
  {
    planId: "starter",
    name: "Starter",
    description: "Perfect for getting started",
    price: 999, // $9.99
    currency: "usd",
    monthlyCredits: 1000,
    features: ["Access to all models", "No watermarks", "Full commercial use"],
    isActive: true,
    isPopular: false,
  },
  {
    planId: "pro",
    name: "Pro",
    description: "Ideal for content creators and professionals",
    price: 2499, // $24.99
    currency: "usd",
    monthlyCredits: 3000,
    features: ["Access to all models", "No watermarks", "Full commercial use", "1080p resolution"],
    isActive: true,
    isPopular: true,
  },
  {
    planId: "max",
    name: "Max",
    description: "For maximum value",
    price: 6999, // $69.99
    currency: "usd",
    monthlyCredits: 9000,
    features: ["Access to all models", "No watermarks", "Full commercial use", "1080p resolution", "Private videos"],
    isActive: true,
    isPopular: false,
  },
];

// Default system configurations - minimal set for business flexibility
const defaultConfigurations = [
  {
    key: "free_tier_credits",
    category: "business",
    name: "Free Tier Credits",
    description: "Number of credits given to new users",
    value: 100,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 1000,
  },
];

// Default model resolution costs data
const defaultModelCosts = [
  // Hailuo-02 model costs
  {
    modelId: "hailuo_02",
    resolution: "768p",
    costPerSecond: 0.045,
    isActive: true,
    notes: "Base resolution for Hailuo-02",
  },
  {
    modelId: "hailuo_02",
    resolution: "1080p",
    costPerSecond: 0.048,
    isActive: true,
    notes: "Premium resolution for Hailuo-02",
  },

  // Seedance-1-Pro model costs
  {
    modelId: "seedance_pro",
    resolution: "480p",
    costPerSecond: 0.03,
    isActive: true,
    notes: "Base resolution for Seedance-1-Pro",
  },
  {
    modelId: "seedance_pro",
    resolution: "1080p",
    costPerSecond: 0.15,
    isActive: true,
    notes: "High quality resolution for Seedance-1-Pro",
  },

  // Google Veo-3 model costs
  {
    modelId: "veo_3",
    resolution: "720p",
    costPerSecond: 0.75,
    isActive: true,
    notes: "Base resolution for Google Veo-3",
  },
  {
    modelId: "veo_3",
    resolution: "1080p",
    costPerSecond: 0.85,
    isActive: true,
    notes: "Premium resolution for Google Veo-3",
  },
];

// Helper function to get parameter definitions for a model
function getModelParameterDefinitions(model: { modelType: string }) {
  const baseDef = {
    prompt: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 1000,
    },
  };

  if (model.modelType === "hailuo") {
    // Hailuo-02 parameters
    return {
      ...baseDef,
      duration: {
        type: "number",
        required: true,
        allowedValues: [6, 10],
        defaultValue: 6,
      },
      resolution: {
        type: "string",
        allowedValues: ["768p", "1080p"],
        defaultValue: "768p",
      },
    };
  }

  if (model.modelType === "seedance") {
    // Seedance-1-Pro parameters
    return {
      ...baseDef,
      duration: {
        type: "number",
        required: true,
        allowedValues: [5, 10],
        defaultValue: 5,
      },
      resolution: {
        type: "string",
        allowedValues: ["480p", "1080p"],
        defaultValue: "480p",
      },
      aspectRatio: {
        type: "string",
        allowedValues: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
        defaultValue: "16:9",
      },
      cameraFixed: {
        type: "boolean",
        defaultValue: false,
      },
    };
  }

  if (model.modelType === "google_veo") {
    // Google Veo-3 parameters (fixed 8s duration)
    return {
      ...baseDef,
      duration: {
        type: "number",
        required: true,
        allowedValues: [8],
        defaultValue: 8,
      },
      resolution: {
        type: "string",
        allowedValues: ["720p", "1080p"],
        defaultValue: "720p",
      },
    };
  }

  return baseDef;
}

// Helper function to get mapping rules for a model
function getModelMappingRules(model: { modelType: string }) {
  const baseMappings = {
    prompt: "prompt",
  };

  if (model.modelType === "hailuo") {
    // Hailuo-02 API mappings
    return {
      ...baseMappings,
      duration: "duration",
      resolution: "resolution",
    };
  }

  if (model.modelType === "seedance") {
    // Seedance-1-Pro API mappings
    return {
      ...baseMappings,
      duration: "duration",
      resolution: "resolution",
      aspectRatio: "aspect_ratio",
      cameraFixed: "camera_fixed",
    };
  }

  if (model.modelType === "google_veo") {
    // Google Veo-3 API mappings (no duration parameter - fixed at 8s)
    return {
      ...baseMappings,
      duration: "duration",
      resolution: "resolution",
    };
  }

  return baseMappings;
}

// Helper function to get constraints for a model
function getModelConstraints(model: { modelType: string }) {
  const constraints: Doc<"modelParameters">["constraints"] = {};

  if (model.modelType === "hailuo") {
    // Hailuo-02 constraints
    constraints.duration = {
      allowedValues: ["6", "10"],
      note: "10 seconds is only available for 768p resolution",
    };
    constraints.resolution = {
      allowedValues: ["768p", "1080p"],
    };
  } else if (model.modelType === "seedance") {
    // Seedance-1-Pro constraints
    constraints.duration = {
      allowedValues: ["5", "10"],
    };
    constraints.resolution = {
      allowedValues: ["480p", "1080p"],
    };
    constraints.aspectRatio = {
      allowedValues: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
      note: "Ignored if an image is provided",
    };
    constraints.fps = {
      allowedValues: ["24"],
    };
  } else if (model.modelType === "google_veo") {
    // Google Veo-3 constraints
    constraints.duration = {
      allowedValues: ["8"],
      note: "Fixed duration for Veo-3",
    };
    constraints.resolution = {
      allowedValues: ["720p", "1080p"],
    };
  }

  return constraints;
}

// Helper function to check and insert data idempotently
async function seedTable<T extends Record<string, any>>(
  ctx: MutationCtx,
  tableName: string,
  data: T[],
  uniqueKey: keyof T | (keyof T)[],
  entityName: string
) {
  const now = Date.now();
  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of data) {
    let existing = null;

    // Handle composite unique keys
    if (Array.isArray(uniqueKey)) {
      // Build filter for composite key
      const filter = uniqueKey.reduce(
        (acc, key) => {
          acc[key as string] = item[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

      // Check if item already exists using composite key
      if (
        tableName === "modelCosts" &&
        uniqueKey.length === 2 &&
        uniqueKey.includes("modelId" as keyof T) &&
        uniqueKey.includes("resolution" as keyof T)
      ) {
        // Use the by_model_and_resolution index for modelCosts table
        existing = await ctx.db
          .query(tableName as any)
          .withIndex("by_model_and_resolution", (q: any) =>
            q.eq("modelId", item.modelId).eq("resolution", item.resolution)
          )
          .first();
      } else {
        // Generic composite key query
        const query = ctx.db.query(tableName as any);
        let filteredQuery = query;

        // Apply filters for composite key
        for (const [key, value] of Object.entries(filter)) {
          filteredQuery = filteredQuery.filter((q: any) => q.eq(key, value));
        }

        existing = await filteredQuery.first();
      }
    } else {
      // Single unique key - use index if available
      if (tableName === "models" && uniqueKey === "modelId") {
        // Use the by_model_id index for models table
        existing = await ctx.db
          .query(tableName as any)
          .withIndex("by_model_id", (q: any) =>
            q.eq("modelId", item[uniqueKey])
          )
          .first();
      } else if (tableName === "modelParameters" && uniqueKey === "modelId") {
        // Use the by_model_id index for modelParameters table
        existing = await ctx.db
          .query(tableName as any)
          .withIndex("by_model_id", (q: any) =>
            q.eq("modelId", item[uniqueKey])
          )
          .first();
      } else if (tableName === "creditPackages" && uniqueKey === "packageId") {
        // Use the by_package_id index for creditPackages table
        existing = await ctx.db
          .query(tableName as any)
          .withIndex("by_package_id", (q: any) =>
            q.eq("packageId", item[uniqueKey])
          )
          .first();
      } else if (tableName === "subscriptionPlans" && uniqueKey === "planId") {
        // Use the by_plan_id index for subscriptionPlans table
        existing = await ctx.db
          .query(tableName as any)
          .withIndex("by_plan_id", (q: any) => q.eq("planId", item[uniqueKey]))
          .first();
      } else if (tableName === "configurations" && uniqueKey === "key") {
        // Use the by_key index for configurations table
        existing = await ctx.db
          .query(tableName as any)
          .withIndex("by_key", (q: any) => q.eq("key", item[uniqueKey]))
          .first();
      } else {
        // Generic query for other tables
        existing = await ctx.db
          .query(tableName as any)
          .filter((q: any) => q.eq(uniqueKey as string, item[uniqueKey]))
          .first();
      }
    }

    if (!existing) {
      await ctx.db.insert(tableName as any, {
        ...item,
        createdAt: now,
        updatedAt: now,
      });
      insertedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(
    `✅ ${entityName}: ${insertedCount} inserted, ${skippedCount} already existed`
  );
  return { inserted: insertedCount, skipped: skippedCount };
}

// Main seed function (idempotent - safe to run multiple times)
export default internalMutation({
  handler: async (ctx: MutationCtx) => {
    console.log("🌱 Starting idempotent database seeding...");
    console.log(
      "ℹ️  This function is safe to run multiple times - existing data will be skipped"
    );

    // 1. Seed Models
    console.log("📊 Seeding models...");
    await seedTable(ctx, "models", defaultModels, "modelId", "Models");

    // 2. Seed Model Parameters
    console.log("⚙️ Seeding model parameters...");
    const modelParametersData = defaultModels.map((model) => ({
      modelId: model.modelId,
      parameterDefinitions: getModelParameterDefinitions(model),
      mappingRules: getModelMappingRules(model),
      constraints: getModelConstraints(model),
      parameterCategories: ["basic", "advanced"],
    }));
    await seedTable(
      ctx,
      "modelParameters",
      modelParametersData,
      "modelId",
      "Model Parameters"
    );

    // 3. Seed Credit Packages
    console.log("💳 Seeding credit packages...");
    await seedTable(
      ctx,
      "creditPackages",
      defaultPackages,
      "packageId",
      "Credit Packages"
    );

    // 4. Seed Subscription Plans
    console.log("📋 Seeding subscription plans...");
    await seedTable(
      ctx,
      "subscriptionPlans",
      defaultPlans,
      "planId",
      "Subscription Plans"
    );

    // 5. Seed Configurations
    console.log("⚙️ Seeding configurations...");
    await seedTable(
      ctx,
      "configurations",
      defaultConfigurations,
      "key",
      "Configurations"
    );

    // 6. Seed Model Resolution Costs
    console.log("💰 Seeding model resolution costs...");
    await seedTable(
      ctx,
      "modelCosts",
      defaultModelCosts,
      ["modelId", "resolution"],
      "Model Resolution Costs"
    );

    console.log("🎉 Idempotent database seeding completed successfully!");
    return "Database seeded successfully (idempotent)";
  },
});
