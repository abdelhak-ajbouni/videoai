import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Default configurations data
const defaultConfigs = [
  // Business Configuration
  {
    key: "profit_margin",
    category: "business",
    name: "Profit Margin",
    description: "Profit margin multiplier (e.g., 1.32 = 32% markup)",
    value: 1.32,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1.0,
    maxValue: 2.0,
  },
  {
    key: "credits_per_dollar",
    category: "business",
    name: "Credits Per Dollar",
    description: "Number of credits equivalent to $1 USD",
    value: 50,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 1000,
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
    minValue: 0,
    maxValue: 1000,
  },
  // Quality Multipliers
  {
    key: "quality_multipliers",
    category: "pricing",
    name: "Quality Multipliers",
    description: "Cost multipliers for different quality tiers",
    value: {
      standard: 1.0,
      high: 1.2,
      ultra: 1.5,
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
  // Feature Flags
  {
    key: "enable_subscriptions",
    category: "features",
    name: "Enable Subscriptions",
    description: "Enable subscription plans for users",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "enable_public_videos",
    category: "features",
    name: "Enable Public Videos",
    description: "Allow users to make videos public",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "enable_video_analytics",
    category: "features",
    name: "Enable Video Analytics",
    description: "Track video views, downloads, and shares",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  // Model Configuration
  {
    key: "default_model",
    category: "models",
    name: "Default Model",
    description: "Default model for new video generations",
    value: "google/veo-3",
    dataType: "string" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "available_models",
    category: "models",
    name: "Available Models",
    description: "List of models available for video generation",
    value: [
      "google/veo-3",
      "luma/ray-2-540p",
      "stability-ai/stable-video-diffusion",
    ],
    dataType: "array" as const,
    isActive: true,
    isEditable: true,
  },
  // Limits Configuration
  {
    key: "max_video_duration",
    category: "limits",
    name: "Maximum Video Duration",
    description: "Maximum video duration in seconds",
    value: 60,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 300,
  },
  {
    key: "max_prompt_length",
    category: "limits",
    name: "Maximum Prompt Length",
    description: "Maximum number of characters in video prompts",
    value: 1000,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 5000,
  },
];

// Default AI models data
const defaultModels = [
  {
    modelId: "google/veo-3",
    name: "Google Veo-3",
    description:
      "Google's latest video generation model with high quality and fast generation",
    replicateModelId: "google/veo-3:2b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8",
    costPerSecond: 0.02,
    fixedDuration: 5,
    modelType: "google_veo",
    apiProvider: "replicate",
    isActive: true,
    isDefault: true,
    isPremium: false,
  },
  {
    modelId: "luma/ray-2-540p",
    name: "Luma Ray Flash 2-540p",
    description: "Fast video generation with good quality at 540p resolution",
    replicateModelId:
      "luma/ray-2-540p:2b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8",
    costPerSecond: 0.015,
    modelType: "luma_ray",
    apiProvider: "replicate",
    isActive: true,
    isDefault: false,
    isPremium: false,
  },
  {
    modelId: "stability-ai/stable-video-diffusion",
    name: "Stable Video Diffusion",
    description:
      "Stable Diffusion's video generation model with high quality output",
    replicateModelId:
      "stability-ai/stable-video-diffusion:2b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8",
    costPerSecond: 0.025,
    modelType: "stability_ai",
    apiProvider: "replicate",
    isActive: true,
    isDefault: false,
    isPremium: true,
  },
];

// Default credit packages data
const defaultPackages = [
  {
    packageId: "small",
    name: "Small",
    description: "Perfect for trying out video generation",
    price: 999, // $9.99
    currency: "usd",
    credits: 100,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "medium",
    name: "Medium",
    description: "Great for regular video creation",
    price: 1999, // $19.99
    currency: "usd",
    credits: 250,
    isActive: true,
    isPopular: true,
  },
  {
    packageId: "large",
    name: "Large",
    description: "Best value for frequent users",
    price: 3499, // $34.99
    currency: "usd",
    credits: 500,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "xlarge",
    name: "X-Large",
    description: "Maximum value for power users",
    price: 5999, // $59.99
    currency: "usd",
    credits: 1000,
    isActive: true,
    isPopular: false,
  },
];

// Default subscription plans data
const defaultPlans = [
  {
    planId: "starter",
    name: "Starter",
    description: "Perfect for getting started with video generation",
    price: 999, // $9.99/month
    currency: "usd",
    monthlyCredits: 50,
    features: ["HD video quality", "Standard processing", "Basic support"],
    isActive: true,
    isPopular: false,
  },
  {
    planId: "pro",
    name: "Pro",
    description: "For creators who need more power and features",
    price: 2499, // $24.99/month
    currency: "usd",
    monthlyCredits: 150,
    features: [
      "Ultra HD video quality",
      "Priority processing",
      "Advanced analytics",
      "Priority support",
    ],
    isActive: true,
    isPopular: true,
  },
  {
    planId: "max",
    name: "Max",
    description: "Maximum features for professional creators",
    price: 4999, // $49.99/month
    currency: "usd",
    monthlyCredits: 350,
    features: [
      "Ultra HD video quality",
      "Highest priority processing",
      "Advanced analytics",
      "Custom model access",
      "Dedicated support",
    ],
    isActive: true,
    isPopular: false,
  },
];

export default internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Check if this is the first run
    const anyConfig = await ctx.db.query("configurations").first();
    const isFirstRun = !anyConfig;

    // Only initialize if this is the first run
    if (!isFirstRun) {
      console.log("Database already initialized, skipping initialization");
      return;
    }

    console.log("Initializing database with default data...");

    // Initialize configurations
    for (const config of defaultConfigs) {
      await ctx.db.insert("configurations", {
        ...config,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize AI models
    for (const model of defaultModels) {
      await ctx.db.insert("models", {
        ...model,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize credit packages
    for (const package_ of defaultPackages) {
      await ctx.db.insert("creditPackages", {
        ...package_,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize subscription plans
    for (const plan of defaultPlans) {
      await ctx.db.insert("subscriptionPlans", {
        ...plan,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize model parameters for each model
    const models = await ctx.db.query("models").collect();
    console.log(`Creating modelParameters for ${models.length} models`);

    for (const model of models) {
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

    console.log("Database initialization completed successfully");
  },
});

// Helper functions for model parameter definitions
function getModelParameterDefinitions(model: {
  modelType: string;
}): Record<string, unknown> {
  const baseParams = {
    prompt: {
      type: "string",
      required: true,
      description: "Text description of the video to generate",
      maxLength: 1000,
    },
    duration: {
      type: "number",
      required: true,
      description: "Duration of the video in seconds",
      minValue: 1,
      maxValue: 60,
    },
  };

  switch (model.modelType) {
    case "google_veo":
      return {
        ...baseParams,
        resolution: {
          type: "string",
          required: false,
          description: "Video resolution",
          allowedValues: ["720p", "1080p"],
          defaultValue: "720p",
        },
        startImageUrl: {
          type: "string",
          required: false,
          description: "URL of starting image for video generation",
        },
      };
    case "luma_ray":
      return {
        ...baseParams,
        aspectRatio: {
          type: "string",
          required: false,
          description: "Aspect ratio of the video",
          allowedValues: ["16:9", "9:16", "1:1"],
          defaultValue: "16:9",
        },
        resolution: {
          type: "string",
          required: false,
          description: "Video resolution",
          allowedValues: ["480p", "720p", "1080p"],
          defaultValue: "480p",
        },
        cameraPosition: {
          type: "string",
          required: false,
          description: "Camera position for 3D scenes",
          allowedValues: ["front", "side", "back", "top"],
        },
      };
    case "stability_ai":
      return {
        ...baseParams,
        resolution: {
          type: "string",
          required: false,
          description: "Video resolution",
          allowedValues: ["768p", "1024p"],
          defaultValue: "768p",
        },
      };
    default:
      return baseParams;
  }
}

function getModelMappingRules(model: {
  modelType: string;
  parameterMappings?: Record<string, string>;
}): Record<string, unknown> {
  const baseRules = {
    prompt: "prompt",
    duration: "duration",
  };

  switch (model.modelType) {
    case "google_veo":
      return {
        ...baseRules,
        resolution: "resolution",
        startImageUrl: "image",
      };
    case "luma_ray":
      return {
        ...baseRules,
        aspectRatio: "aspect_ratio",
        resolution: "resolution",
        cameraPosition: "camera_position",
      };
    case "stability_ai":
      return {
        ...baseRules,
        resolution: "resolution",
      };
    default:
      return baseRules;
  }
}

function getModelConstraints(model: {
  modelType: string;
}): Record<string, unknown> {
  const baseConstraints = {
    prompt: {
      maxLength: 1000,
    },
    duration: {
      minValue: 1,
      maxValue: 60,
    },
  };

  switch (model.modelType) {
    case "google_veo":
      return {
        ...baseConstraints,
        resolution: {
          allowedValues: ["720p", "1080p"],
        },
      };
    case "luma_ray":
      return {
        ...baseConstraints,
        aspectRatio: {
          allowedValues: ["16:9", "9:16", "1:1"],
        },
        resolution: {
          allowedValues: ["480p", "720p", "1080p"],
        },
        cameraPosition: {
          allowedValues: ["front", "side", "back", "top"],
        },
      };
    case "stability_ai":
      return {
        ...baseConstraints,
        resolution: {
          allowedValues: ["768p", "1024p"],
        },
      };
    default:
      return baseConstraints;
  }
}

// Update credit packages with new pricing
export const updateCreditPackages = internalMutation({
  args: {
    confirmDeletion: v.boolean(),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("Updating credit packages with new volume discount pricing...");

    if (!args.confirmDeletion) {
      throw new Error(
        "Deletion confirmation required. Set confirmDeletion to true to proceed."
      );
    }

    const allowedEnvironments = ["development", "staging", "test"];
    if (args.environment && !allowedEnvironments.includes(args.environment)) {
      throw new Error(
        `Environment '${args.environment}' is not allowed for this operation. Allowed: ${allowedEnvironments.join(", ")}`
      );
    }

    const now = Date.now();

    const existingPackages = await ctx.db.query("creditPackages").collect();
    if (existingPackages.length === 0) {
      console.log("No existing packages to delete");
    } else {
      console.log(
        `About to delete ${existingPackages.length} existing credit packages...`
      );
      for (const pkg of existingPackages) {
        await ctx.db.delete(pkg._id);
      }
      console.log(
        `Deleted ${existingPackages.length} existing credit packages`
      );
    }

    for (const package_ of defaultPackages) {
      await ctx.db.insert("creditPackages", {
        ...package_,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(
      `Created ${defaultPackages.length} new credit packages with volume discounts`
    );

    return {
      message:
        "Credit packages updated successfully with volume discount pricing",
      packagesUpdated: defaultPackages.length,
      packagesDeleted: existingPackages.length,
    };
  },
});

// Update subscription plans with new features
export const updateSubscriptionPlans = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Updating subscription plans with new features...");

    const now = Date.now();

    const existingPlans = await ctx.db.query("subscriptionPlans").collect();
    for (const plan of existingPlans) {
      await ctx.db.delete(plan._id);
    }
    console.log(`Deleted ${existingPlans.length} existing subscription plans`);

    for (const plan of defaultPlans) {
      await ctx.db.insert("subscriptionPlans", {
        ...plan,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(
      `Created ${defaultPlans.length} new subscription plans with updated features`
    );

    return {
      message: "Subscription plans updated successfully with new features",
      plansUpdated: defaultPlans.length,
    };
  },
});
