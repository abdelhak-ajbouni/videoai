import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Action to manually trigger model discovery
 */
export const triggerDiscovery = action({
  args: {
    force: v.optional(v.boolean()),
    maxModels: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if discovery is already running
    const isRunning = await ctx.runQuery(api.discovery.modelDiscovery.isDiscoveryRunning);
    
    if (isRunning && !args.force) {
      throw new Error('Model discovery is already running. Use force=true to override.');
    }
    
    // If forcing and there's a running discovery, clean it up first
    if (args.force && isRunning) {
      await ctx.runMutation(api.discovery.modelDiscovery.cleanupStaleDiscoveries, {
        maxAgeHours: 0, // Clean up immediately
      });
    }
    
    // Trigger discovery
    return await ctx.runAction(api.discovery.modelDiscovery.discoverModels, {
      maxModels: args.maxModels || 1000,
      updateExisting: true,
    });
  },
});

/**
 * Query to get discovery dashboard data
 */
export const getDiscoveryDashboard = query({
  args: {},
  handler: async (ctx) => {
    // Get latest discovery log
    const latestDiscovery = await ctx.runQuery(api.discovery.modelDiscovery.getLatestDiscoveryLog);
    
    // Get discovery stats
    const stats = await ctx.runQuery(api.discovery.modelDiscovery.getDiscoveryStats, {
      timeWindow: '30d',
    });
    
    // Check if discovery is running
    const isRunning = await ctx.runQuery(api.discovery.modelDiscovery.isDiscoveryRunning);
    
    // Get recent discovery logs
    const recentLogs = await ctx.runQuery(api.discovery.modelDiscovery.getDiscoveryLogs, {
      limit: 10,
    });
    
    // Get model counts by category
    const allModels = await ctx.db.query("models").collect();
    const modelStats = {
      total: allModels.length,
      active: allModels.filter(m => m.isActive).length,
      discovered: allModels.filter(m => m.discoveredAt).length,
      premium: allModels.filter(m => m.isPremium).length,
      byProvider: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };
    
    // Count by provider
    allModels.forEach(model => {
      const provider = model.provider || 'unknown';
      modelStats.byProvider[provider] = (modelStats.byProvider[provider] || 0) + 1;
    });
    
    // Count by category
    allModels.forEach(model => {
      const category = model.category || 'unknown';
      modelStats.byCategory[category] = (modelStats.byCategory[category] || 0) + 1;
    });
    
    return {
      latestDiscovery,
      stats,
      isRunning,
      recentLogs,
      modelStats,
      lastUpdated: Date.now(),
    };
  },
});

/**
 * Query to get model discovery insights
 */
export const getDiscoveryInsights = query({
  args: {
    timeWindow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || '30d';
    const now = Date.now();
    
    let startTime: number;
    switch (timeWindow) {
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startTime = now - (90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    // Get models discovered in the time window
    const discoveredModels = await ctx.db
      .query("models")
      .withIndex("by_discovery", (q) => q.gte("discoveredAt", startTime))
      .collect();
    
    // Get discovery logs in the time window
    const discoveryLogs = await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_started_at", (q) => q.gte("startedAt", startTime))
      .collect();
    
    // Calculate insights
    const insights = {
      newModelsDiscovered: discoveredModels.length,
      totalDiscoveryRuns: discoveryLogs.length,
      successfulRuns: discoveryLogs.filter(l => l.status === 'completed').length,
      failedRuns: discoveryLogs.filter(l => l.status === 'failed').length,
      averageModelsPerRun: discoveryLogs.length > 0 
        ? discoveryLogs.reduce((sum, l) => sum + (l.modelsFound || 0), 0) / discoveryLogs.length
        : 0,
      topProviders: {} as Record<string, number>,
      confidenceDistribution: {
        high: discoveredModels.filter(m => (m.confidence || 0) >= 80).length,
        medium: discoveredModels.filter(m => (m.confidence || 0) >= 60 && (m.confidence || 0) < 80).length,
        low: discoveredModels.filter(m => (m.confidence || 0) < 60).length,
      },
      timeWindow,
    };
    
    // Count by provider
    discoveredModels.forEach(model => {
      const provider = model.provider || 'unknown';
      insights.topProviders[provider] = (insights.topProviders[provider] || 0) + 1;
    });
    
    return insights;
  },
});

/**
 * Mutation to update model discovery settings
 */
export const updateDiscoverySettings = mutation({
  args: {
    enableAutoDiscovery: v.optional(v.boolean()),
    discoveryFrequency: v.optional(v.string()),
    maxModelsPerRun: v.optional(v.number()),
    confidenceThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Store discovery settings in configurations table
    const settings = {
      enableAutoDiscovery: args.enableAutoDiscovery ?? true,
      discoveryFrequency: args.discoveryFrequency ?? 'daily',
      maxModelsPerRun: args.maxModelsPerRun ?? 1000,
      confidenceThreshold: args.confidenceThreshold ?? 70,
      updatedAt: Date.now(),
    };
    
    // Update or create discovery configuration
    const existingConfig = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "model_discovery"))
      .first();
    
    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        value: settings,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("configurations", {
        key: "model_discovery",
        category: "discovery",
        name: "Model Discovery Settings",
        description: "Configuration for automatic model discovery",
        value: settings,
        dataType: "object",
        isActive: true,
        isEditable: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return settings;
  },
});

/**
 * Query to get discovery settings
 */
export const getDiscoverySettings = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "model_discovery"))
      .first();
    
    if (!config) {
      // Return default settings
      return {
        enableAutoDiscovery: true,
        discoveryFrequency: 'daily',
        maxModelsPerRun: 1000,
        confidenceThreshold: 70,
      };
    }
    
    return config.value;
  },
});

/**
 * Action to validate discovered models
 */
export const validateDiscoveredModels = action({
  args: {
    modelIds: v.optional(v.array(v.string())),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minConfidence = args.minConfidence || 70;
    
    // Get models to validate
    let modelsToValidate;
    if (args.modelIds) {
      modelsToValidate = await Promise.all(
        args.modelIds.map(id => 
          ctx.runQuery(api.models.getModelById, { modelId: id })
        )
      );
      modelsToValidate = modelsToValidate.filter(Boolean);
    } else {
      // Get all discovered models with low confidence
      const allModels = await ctx.db.query("models").collect();
      modelsToValidate = allModels.filter(m => 
        m.discoveredAt && (m.confidence || 0) < minConfidence
      );
    }
    
    console.log(`Validating ${modelsToValidate.length} models...`);
    
    let validated = 0;
    let errors: string[] = [];
    
    for (const model of modelsToValidate) {
      try {
        // Re-analyze the model (this would involve calling the discovery service)
        // For now, we'll just update the validation timestamp
        await ctx.db.patch(model._id, {
          lastValidatedAt: Date.now(),
          updatedAt: Date.now(),
        });
        validated++;
      } catch (error) {
        const errorMsg = `Failed to validate ${model.modelId}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    return {
      totalModels: modelsToValidate.length,
      validated,
      errors,
      timestamp: Date.now(),
    };
  },
});