/**
 * DATABASE SEED SCRIPT
 * 
 * This file is responsible for seeding the database with initial data.
 * It should ONLY be used for:
 * - Populating empty tables with default/sample data
 * - Development environment setup
 * - Fresh database initialization
 * 
 * This is NOT for migrations or data transformations.
 * For production data changes, use proper migration scripts.
 * For clearing data, use dbUtils.ts
 */

import { internalMutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";

// Default AI models data
const defaultModels = [
  {
    modelId: "luma/ray-flash-2-540p",
    name: "Budget Model",
    description: "Ultra-budget model for testing and basic video generation",
    replicateModelId:
      "luma/ray-flash-2-540p:f8e75d44d8d24c8faf7c8b5beb10eb1e8e5b5c01a2da88ee4be8c2e5b80a9b5",
    costPerSecond: 0.12,
    modelType: "hailuo",
    isActive: true,
    isDefault: true,
    isPremium: false,
  },
  {
    modelId: "luma/ray-2-720p",
    name: "Standard Model",
    description: "Budget-friendly model for regular video generation",
    replicateModelId:
      "luma/ray-2-720p:89b7cc7ed5cb8c36b8d43b5b81ee65a1b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5",
    costPerSecond: 0.18,
    modelType: "seedance",
    isActive: true,
    isDefault: false,
    isPremium: false,
  },
  {
    modelId: "google/veo-3",
    name: "Flagship Model",
    description: "Premium videos with audio support",
    replicateModelId:
      "google/veo-3:838c69a013a666f41312ba018c1ae55a2807f27c109a9cb93b22a45f207ad918",
    costPerSecond: 0.75,
    modelType: "google_veo",
    isActive: true,
    isDefault: false,
    isPremium: true,
  },
];

// Default credit packages data
const defaultPackages = [
  {
    packageId: "small",
    name: "Small Boost",
    description: "Extra credits for subscribers",
    price: 1499, // $14.99
    currency: "usd",
    credits: 500,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "medium",
    name: "Medium Boost",
    description: "Popular choice for subscribers",
    price: 2999, // $29.99
    currency: "usd",
    credits: 1000,
    isActive: true,
    isPopular: true,
  },
  {
    packageId: "large",
    name: "Large Boost",
    description: "Great value for heavy users",
    price: 4999, // $49.99
    currency: "usd",
    credits: 1750,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "xlarge",
    name: "X-Large Boost",
    description: "Maximum credits package",
    price: 7999, // $79.99
    currency: "usd",
    credits: 3000,
    isActive: true,
    isPopular: false,
  },
];

// Default subscription plans data
const defaultPlans = [
  {
    planId: "starter",
    name: "Starter",
    description: "Perfect for individuals getting started",
    price: 999, // $9.99
    currency: "usd",
    monthlyCredits: 100,
    features: ["HD video quality", "Standard models", "Email support"],
    isActive: true,
    isPopular: false,
  },
  {
    planId: "pro",
    name: "Pro",
    description: "Ideal for content creators and professionals",
    price: 2999, // $29.99
    currency: "usd",
    monthlyCredits: 500,
    features: [
      "Ultra HD quality",
      "All AI models",
      "Priority processing",
      "Advanced editing",
      "Priority support",
    ],
    isActive: true,
    isPopular: true,
  },
  {
    planId: "max",
    name: "Max",
    description: "For teams and power users",
    price: 9999, // $99.99
    currency: "usd",
    monthlyCredits: 2000,
    features: [
      "Everything in Pro",
      "Private videos",
      "Team collaboration",
      "Custom models",
      "Dedicated support",
      "API access",
    ],
    isActive: true,
    isPopular: false,
  },
];

// Default system configurations
const defaultConfigurations = [
  {
    key: "profit_margin",
    category: "pricing",
    name: "Profit Margin",
    description: "Markup percentage applied to model costs",
    value: 1.32,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1.0,
    maxValue: 2.0,
  },
  {
    key: "free_tier_credits",
    category: "business",
    name: "Free Tier Credits",
    description: "Number of credits given to new users",
    value: 10,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 1000,
  },
  {
    key: "max_video_duration",
    category: "limits",
    name: "Maximum Video Duration",
    description: "Maximum allowed video duration in seconds",
    value: 120,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 5,
    maxValue: 120,
  },
];

// Helper function to get supported durations for a model type
function getModelSupportedDurations(modelType: string): number[] {
  switch (modelType) {
    case "google_veo":
      return [8];
    case "hailuo":
      return [6, 10];
    case "seedance":
      return [5, 10];
    default:
      return [5];
  }
}

// Helper function to get parameter definitions for a model
function getModelParameterDefinitions(model: { modelType: string }) {
  const baseDef = {
    prompt: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 1000,
    },
    duration: {
      type: "number",
      required: true,
      allowedValues: getModelSupportedDurations(model.modelType),
      defaultValue: Math.min(...getModelSupportedDurations(model.modelType)),
    },
  };

  if (model.modelType === "hailuo") {
    return {
      ...baseDef,
      resolution: {
        type: "string",
        allowedValues: ["720p"],
        defaultValue: "720p",
      },
    };
  }

  if (model.modelType === "seedance") {
    return {
      ...baseDef,
      aspectRatio: {
        type: "string",
        allowedValues: ["16:9", "9:16", "1:1"],
        defaultValue: "16:9",
      },
    };
  }

  if (model.modelType === "google_veo") {
    return {
      ...baseDef,
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
    duration: "duration_seconds",
  };

  // Default mappings based on model type
  if (model.modelType === "hailuo") {
    return {
      ...baseMappings,
      resolution: "resolution",
    };
  }

  if (model.modelType === "seedance") {
    return {
      ...baseMappings,
      aspectRatio: "aspect_ratio",
    };
  }

  if (model.modelType === "google_veo") {
    return {
      ...baseMappings,
      resolution: "resolution",
      startImageUrl: "image",
    };
  }

  return baseMappings;
}

// Helper function to get constraints for a model
function getModelConstraints(model: { modelType: string }) {
  const constraints: any = {
    duration: {
      allowedValues: getModelSupportedDurations(model.modelType).map(String),
    },
  };

  // Add model-specific constraints based on model type
  if (model.modelType === "hailuo") {
    constraints.resolution = {
      allowedValues: ["720p"],
    };
  } else if (model.modelType === "seedance") {
    constraints.aspectRatio = {
      allowedValues: ["16:9", "9:16", "1:1"],
    };
  } else if (model.modelType === "google_veo") {
    constraints.resolution = {
      allowedValues: ["720p", "1080p"],
    };
  }

  return constraints;
}

// Main seed function
export default internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    console.log("🌱 Starting database seeding...");

    // 1. Seed Models
    console.log("📊 Seeding models...");
    for (const modelData of defaultModels) {
      await ctx.db.insert("models", {
        ...modelData,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✅ Seeded ${defaultModels.length} models`);

    // 2. Seed Model Parameters
    console.log("⚙️ Seeding model parameters...");
    for (const model of defaultModels) {
      const parameterDefinitions = getModelParameterDefinitions(model);
      const mappingRules = getModelMappingRules(model);
      const constraints = getModelConstraints(model);

      await ctx.db.insert("modelParameters", {
        modelId: model.modelId,
        parameterDefinitions,
        mappingRules,
        constraints,
        parameterCategories: ["basic", "advanced"],
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✅ Seeded ${defaultModels.length} model parameters`);

    // 3. Seed Credit Packages
    console.log("💳 Seeding credit packages...");
    for (const packageData of defaultPackages) {
      await ctx.db.insert("creditPackages", {
        ...packageData,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✅ Seeded ${defaultPackages.length} credit packages`);

    // 4. Seed Subscription Plans
    console.log("📋 Seeding subscription plans...");
    for (const planData of defaultPlans) {
      await ctx.db.insert("subscriptionPlans", {
        ...planData,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✅ Seeded ${defaultPlans.length} subscription plans`);

    // 5. Seed Configurations
    console.log("⚙️ Seeding configurations...");
    for (const configData of defaultConfigurations) {
      await ctx.db.insert("configurations", {
        ...configData,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✅ Seeded ${defaultConfigurations.length} configurations`);

    console.log("🎉 Database seeding completed successfully!");
    return "Database seeded successfully";
  },
});