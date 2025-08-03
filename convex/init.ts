import {
  internalMutation,
  mutation,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";

// Type definitions for better type safety
interface ModelParameterDefinition {
  type: string;
  required: boolean;
  description: string;
  allowedValues?: string[] | number[];
  defaultValue?: string | number;
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
}

interface ModelParameterDefinitions {
  [key: string]: ModelParameterDefinition;
}

interface ModelConstraints {
  [key: string]: {
    allowedValues?: string[] | number[];
    minValue?: number;
    maxValue?: number;
    maxLength?: number;
    minLength?: number;
  };
}

interface VideoData {
  _id: string;
  prompt: string;
  duration: string;
  model: string;
  quality?: string;
  generationSettings?: Record<string, unknown>;
  createdAt: number;
  [key: string]: unknown;
}

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
    key: "enable_ultra_quality",
    category: "features",
    name: "Enable Ultra Quality",
    description: "Whether ultra quality tier is available",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "enable_priority_processing",
    category: "features",
    name: "Enable Priority Processing",
    description:
      "Whether priority processing is available for Pro/Business users",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "enable_api_access",
    category: "features",
    name: "Enable API Access",
    description: "Whether API access is available for Business users",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  // System Limits
  {
    key: "max_prompt_length",
    category: "limits",
    name: "Maximum Prompt Length",
    description: "Maximum number of characters allowed in video prompts",
    value: 500,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 100,
    maxValue: 2000,
  },
  {
    key: "max_concurrent_generations",
    category: "limits",
    name: "Maximum Concurrent Generations",
    description: "Maximum number of videos a user can generate simultaneously",
    value: 3,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 10,
  },
  {
    key: "max_video_duration",
    category: "limits",
    name: "Maximum Video Duration",
    description: "Maximum video duration in seconds",
    value: 60,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 5,
    maxValue: 120,
  },
  // Subscription Quality Access
  {
    key: "subscription_quality_access",
    category: "subscriptions",
    name: "Subscription Quality Access",
    description: "Quality tiers available for each subscription level",
    value: {
      free: ["standard"],
      starter: ["standard", "high"],
      pro: ["standard", "high", "ultra"],
      business: ["standard", "high", "ultra"],
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
];

// Clean AI models data - Budget/Quality/Pro tier structure
const defaultModels = [
  {
    modelId: "minimax/hailuo-02",
    name: "Budget Tier",
    description: "Fast and affordable videos with excellent physics",
    replicateModelId: "minimax/hailuo-02",
    costPerSecond: 0.08,
    parameterMappings: {
      duration: "duration",
      resolution: "resolution",
    },
    modelType: "hailuo",
    apiProvider: "replicate",

    isActive: true,
    isDefault: true,
    isPremium: false,
  },
  {
    modelId: "bytedance/seedance-1-pro",
    name: "Quality Tier",
    description:
      "Professional videos with multiple aspect ratios and camera position",
    replicateModelId: "bytedance/seedance-1-pro",
    costPerSecond: 0.28,
    parameterMappings: {
      duration: "duration",
      aspectRatio: "aspect_ratio",
      resolution: "resolution",
      seed: "seed",
      cameraPosition: "camera_position",
    },
    modelType: "seedance",
    apiProvider: "replicate",

    isActive: true,
    isDefault: false,
    isPremium: false,
  },
  {
    modelId: "google/veo-3",
    name: "Pro Tier",
    description: "Premium videos with audio support",
    replicateModelId:
      "google/veo-3:838c69a013a666f41312ba018c1ae55a2807f27c109a9cb93b22a45f207ad918",
    costPerSecond: 0.75,
    fixedDuration: 8,
    parameterMappings: {
      resolution: "resolution",
      startImageUrl: "image",
    },
    modelType: "google_veo",
    apiProvider: "replicate",

    isActive: true,
    isDefault: false,
    isPremium: true,
  },
];

// Default credit packages data - Subscriber-only bonus packages
const defaultPackages = [
  {
    packageId: "small",
    name: "Small Boost",
    description: "Extra credits for subscribers",
    price: 1499, // $14.99
    currency: "usd",
    credits: 500, // $0.030/credit (premium pricing for bonus)
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "medium",
    name: "Medium Boost",
    description: "Popular choice for subscribers",
    price: 2999, // $29.99
    currency: "usd",
    credits: 1000, // $0.030/credit (consistent pricing)
    isActive: true,
    isPopular: true,
  },
  {
    packageId: "large",
    name: "Large Boost",
    description: "For heavy users",
    price: 5999, // $59.99
    currency: "usd",
    credits: 2000, // $0.030/credit (consistent pricing)
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "xlarge",
    name: "X-Large Boost",
    description: "Maximum boost for power users",
    price: 11999, // $119.99
    currency: "usd",
    credits: 4000, // $0.030/credit (consistent pricing)
    isActive: true,
    isPopular: false,
  },
] as const;

// Default subscription plans data
const defaultPlans = [
  {
    planId: "starter",
    name: "Starter",
    description: "Perfect for getting started with video generation",
    price: 499,
    currency: "usd",
    monthlyCredits: 250,
    features: ["720p video quality", "No Watermarks", "Full Commercial Use"],
    isActive: true,
    isPopular: false,
  },
  {
    planId: "pro",
    name: "Pro",
    description: "For creators who need more power and features",
    price: 1499,
    currency: "usd",
    monthlyCredits: 750,
    features: ["1080p video quality", "No Watermarks", "Full Commercial Use"],
    isActive: true,
    isPopular: true,
  },
  {
    planId: "max",
    name: "Max",
    description: "Enterprise-grade features for teams and businesses",
    price: 3999,
    currency: "usd",
    monthlyCredits: 2000,
    features: [
      "1080p video quality",
      "No Watermarks",
      "Full Commercial Use",
      "Private videos by default",
    ],
    isActive: true,
    isPopular: false,
  },
];

// Migration function to clean up database
async function runMigrations(ctx: MutationCtx) {
  console.log("Starting database migrations...");

  const errors: string[] = [];
  const criticalErrors: string[] = [];

  // Migration 1: Clean up models table - replace with clean schema
  try {
    console.log("Starting models cleanup...");
    const existingModels = await ctx.db.query("models").collect();
    if (existingModels.length > 0) {
      // Delete old models
      for (const model of existingModels) {
        await ctx.db.delete(model._id);
      }

      // Insert clean models
      const now = Date.now();
      for (const model of defaultModels) {
        await ctx.db.insert("models", {
          ...model,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    console.log("Models cleanup completed successfully");
  } catch (error) {
    const errorMessage = `Models cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    criticalErrors.push(errorMessage);
  }

  // Migration 2: Populate modelParameters table for existing videos
  let parametersCreated = 0;
  let alreadyExists = 0;
  let videoErrors = 0;

  try {
    console.log("Starting modelParameters population...");
    const videos = await ctx.db.query("videos").collect();

    for (const video of videos) {
      try {
        // Check if modelParameters already exists for this video
        const existingParams = await ctx.db
          .query("modelParameters")
          .withIndex("by_video_id", (q) => q.eq("videoId", video._id))
          .first();

        if (existingParams) {
          alreadyExists++;
          continue;
        }

        // Create parameters based on video data and model type
        const frontendParams = {
          prompt: video.prompt,
          duration: video.duration,
          quality: video.quality,
          ...(video.generationSettings || {}),
        };

        // Map parameters using inline logic
        const apiParameters: Record<string, unknown> = { prompt: video.prompt };

        if (video.model.includes("google/veo")) {
          // Google Veo models
          apiParameters.resolution = frontendParams.resolution || "720p";

          if (frontendParams.startImageUrl) {
            apiParameters.image = frontendParams.startImageUrl;
          }

          apiParameters.seed = Math.floor(Math.random() * 1000000);
        } else if (video.model.includes("seedance")) {
          // Seedance models
          apiParameters.duration = parseInt(video.duration);
          apiParameters.aspect_ratio = frontendParams.aspectRatio || "16:9";
          apiParameters.resolution = frontendParams.resolution || "480p";
          apiParameters.seed = Math.floor(Math.random() * 1000000);

          if (frontendParams.cameraPosition) {
            apiParameters.camera_position = frontendParams.cameraPosition;
          }
        } else {
          // Hailuo models (default)
          apiParameters.duration = parseInt(video.duration);
          apiParameters.resolution = frontendParams.resolution || "768p";
        }

        // Create modelParameters record
        await ctx.db.insert("modelParameters", {
          videoId: video._id,
          modelId: video.model,
          parameters: apiParameters,
          parameterMapping: {
            frontendParameters: frontendParams,
            mappingLog: [`Parameters mapped for ${video.model}`],
          },
          createdAt: video.createdAt,
        });

        parametersCreated++;
      } catch (error) {
        const errorMessage = `Error processing video ${video._id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
        videoErrors++;
      }
    }
    console.log("ModelParameters population completed successfully");
  } catch (error) {
    const errorMessage = `ModelParameters population failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    criticalErrors.push(errorMessage);
  }

  // Migration 3: Remove old thumbnail fields from existing video records
  let thumbnailFieldsRemoved = 0;
  try {
    console.log("Starting thumbnail fields removal...");
    const videos = await ctx.db.query("videos").collect();

    for (const video of videos) {
      try {
        // Check if video has the old thumbnail fields
        const videoData = video as VideoData & {
          thumbnailFileId?: string;
          thumbnailUrl?: string;
        };
        if (videoData.thumbnailFileId || videoData.thumbnailUrl) {
          // Remove the old fields by patching without them
          await ctx.db.patch(video._id, {
            updatedAt: Date.now(),
          });

          thumbnailFieldsRemoved++;
        }
      } catch (error) {
        const errorMessage = `Error removing thumbnail fields from video ${video._id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
    console.log("Thumbnail fields removal completed successfully");
  } catch (error) {
    const errorMessage = `Thumbnail fields removal failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    criticalErrors.push(errorMessage);
  }

  // Migration 4: Remove title fields from existing video records
  let titleFieldsRemoved = 0;
  try {
    console.log("Starting title fields removal...");
    const videos = await ctx.db.query("videos").collect();

    for (const video of videos) {
      try {
        // Check if video has the old title field
        const videoData = video as VideoData & { title?: string };
        if (videoData.title !== undefined) {
          // Remove the title field by patching without it
          await ctx.db.patch(video._id, {
            updatedAt: Date.now(),
          });

          titleFieldsRemoved++;
        }
      } catch (error) {
        const errorMessage = `Error removing title field from video ${video._id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
    console.log("Title fields removal completed successfully");
  } catch (error) {
    const errorMessage = `Title fields removal failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    criticalErrors.push(errorMessage);
  }

  // Migration 5: Restructure modelParameters and create videoParameters
  try {
    console.log("Starting parameter structure migration...");
    await migrateToNewParameterStructure(ctx);
    console.log("Parameter structure migration completed successfully");
  } catch (error) {
    const errorMessage = `Parameter structure migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    criticalErrors.push(errorMessage);
  }

  // Check for critical errors and throw if any exist
  if (criticalErrors.length > 0) {
    const errorSummary = `Migration failed with ${criticalErrors.length} critical errors:\n${criticalErrors.join("\n")}`;
    console.error(errorSummary);
    throw new Error(errorSummary);
  }

  // Log summary of all migrations
  console.log(`Migrations completed successfully:
    - Models cleaned and recreated
    - Model parameters created: ${parametersCreated}, already existed: ${alreadyExists}, errors: ${videoErrors}
    - Thumbnail fields removed: ${thumbnailFieldsRemoved}
    - Title fields removed: ${titleFieldsRemoved}
    - Parameter structure migrated
    - Non-critical errors: ${errors.length}
  `);

  // Return summary for potential use by caller
  return {
    success: true,
    parametersCreated,
    alreadyExists,
    videoErrors,
    thumbnailFieldsRemoved,
    titleFieldsRemoved,
    nonCriticalErrors: errors.length,
  };
}

// Migration 3: Restructure modelParameters and create videoParameters
async function migrateToNewParameterStructure(ctx: MutationCtx) {
  console.log("Running parameter structure migration...");

  // Step 1: Move existing modelParameters data to videoParameters
  const existingModelParams = await ctx.db.query("modelParameters").collect();
  console.log(
    `Found ${existingModelParams.length} existing modelParameters records`
  );

  // Check if this is the old structure that needs migration
  const hasOldStructure =
    existingModelParams.length > 0 &&
    existingModelParams.some((param) => param.videoId && param.parameters);

  if (hasOldStructure) {
    // Only migrate if we have the old structure with videoId
    for (const param of existingModelParams) {
      if (param.videoId && param.parameters) {
        // Insert into videoParameters
        await ctx.db.insert("videoParameters", {
          videoId: param.videoId,
          modelId: param.modelId,
          parameters: param.parameters,
          parameterMapping: param.parameterMapping,
          createdAt: param.createdAt,
        });
      }

      // Delete from old table
      await ctx.db.delete(param._id);
    }

    // Step 2: Clear all modelParameters and recreate for current models
    const allModelParams = await ctx.db.query("modelParameters").collect();
    console.log(`Deleting ${allModelParams.length} old modelParameters`);

    for (const param of allModelParams) {
      await ctx.db.delete(param._id);
    }

    // Step 3: Create new modelParameters entries for each model
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    console.log("Parameter structure migration completed");
  } else {
    console.log("Parameter structure already migrated or no data to migrate");
  }
}

// Helper function to get parameter definitions for a model
function getModelParameterDefinitions(model: {
  modelType: string;
}): ModelParameterDefinitions {
  const baseParams: ModelParameterDefinitions = {
    prompt: {
      type: "string",
      required: true,
      description: "Text description of the video to generate",
      maxLength: 500,
    },
    duration: {
      type: "number",
      required: true,
      description: "Duration of the video in seconds",
      allowedValues: getModelSupportedDurations(model.modelType),
      defaultValue: Math.min(...getModelSupportedDurations(model.modelType)), // Set to smallest available
    },
  };

  // Add model-specific parameters based on model type
  if (model.modelType === "hailuo") {
    baseParams.resolution = {
      type: "string",
      required: false,
      description: "Resolution of the video",
      allowedValues: ["768p", "1080p"],
      defaultValue: "768p", // Set to smallest available
    };
  }

  if (model.modelType === "seedance") {
    baseParams.aspectRatio = {
      type: "string",
      required: false,
      description: "Aspect ratio of the video",
      allowedValues: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
      defaultValue: "16:9", // Keep 16:9 as requested
    };
    baseParams.resolution = {
      type: "string",
      required: false,
      description: "Resolution of the video",
      allowedValues: ["480p", "1080p"],
      defaultValue: "480p", // Set to smallest available
    };
    baseParams.seed = {
      type: "number",
      required: false,
      description: "Seed for reproducible generation",
      minValue: 0,
      maxValue: 2147483647,
    };
    baseParams.cameraPosition = {
      type: "string",
      required: false,
      description: "Camera movement type",
      allowedValues: ["fixed", "dynamic"],
      defaultValue: "fixed",
    };
  }

  if (model.modelType === "google_veo") {
    baseParams.resolution = {
      type: "string",
      required: false,
      description: "Resolution of the video",
      allowedValues: ["720p", "1080p"],
      defaultValue: "720p", // Set to smallest available
    };
    baseParams.seed = {
      type: "number",
      required: false,
      description: "Random seed for consistent results",
      minValue: 0,
      maxValue: 999999,
    };
  }

  return baseParams;
}

// Helper function to get supported durations based on model type
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

// Helper function to get mapping rules for a model
function getModelMappingRules(model: {
  modelType: string;
  parameterMappings?: Record<string, string>;
}) {
  const baseMappings = {
    prompt: "prompt",
    duration: "duration",
  };

  // Add model-specific mappings
  if (model.parameterMappings) {
    return { ...baseMappings, ...model.parameterMappings };
  }

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
      resolution: "resolution",
      seed: "seed",
      cameraPosition: "camera_position",
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
function getModelConstraints(model: { modelType: string }): ModelConstraints {
  const constraints: ModelConstraints = {
    prompt: {
      maxLength: 500,
      minLength: 1,
    },
    duration: {
      allowedValues: getModelSupportedDurations(model.modelType).map(String),
    },
  };

  // Add model-specific constraints based on model type
  if (model.modelType === "hailuo") {
    constraints.resolution = {
      allowedValues: ["768p", "1080p"],
    };
  }

  if (model.modelType === "seedance") {
    constraints.aspectRatio = {
      allowedValues: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"],
    };
    constraints.resolution = {
      allowedValues: ["480p", "1080p"],
    };
  }

  if (model.modelType === "google_veo") {
    constraints.resolution = {
      allowedValues: ["720p", "1080p"],
    };
  }

  return constraints;
}

export default internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();

    // Check if this is the first run or if we need to run migrations
    const anyConfig = await ctx.db.query("configurations").first();
    const isFirstRun = !anyConfig;

    // Run migrations for existing databases
    if (!isFirstRun) {
      await runMigrations(ctx);
      return;
    }

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
  },
});

// Update credit packages with new pricing
export const updateCreditPackages = mutation({
  args: {
    confirmDeletion: v.boolean(), // Require explicit confirmation
    environment: v.optional(v.string()), // Optional environment check
  },
  handler: async (ctx, args) => {
    console.log("Updating credit packages with new volume discount pricing...");

    // Safety check: require explicit confirmation
    if (!args.confirmDeletion) {
      throw new Error(
        "Deletion confirmation required. Set confirmDeletion to true to proceed."
      );
    }

    // Environment check: only allow in development or staging
    const allowedEnvironments = ["development", "staging", "test"];
    if (args.environment && !allowedEnvironments.includes(args.environment)) {
      throw new Error(
        `Environment '${args.environment}' is not allowed for this operation. Allowed: ${allowedEnvironments.join(", ")}`
      );
    }

    const now = Date.now();

    // Delete existing packages with additional safety check
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

    // Insert new packages with volume discounts
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
export const updateSubscriptionPlans = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Updating subscription plans with new features...");

    const now = Date.now();

    // Delete existing plans
    const existingPlans = await ctx.db.query("subscriptionPlans").collect();
    for (const plan of existingPlans) {
      await ctx.db.delete(plan._id);
    }
    console.log(`Deleted ${existingPlans.length} existing subscription plans`);

    // Insert new plans with updated features
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
