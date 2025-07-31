import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { api } from "../_generated/api";
import { createModelDiscoveryService } from "../services/modelDiscovery";

/**
 * Action to discover video models from Replicate
 */
export const discoverModels = action({
  args: {
    maxModels: v.optional(v.number()),
    updateExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const discoveryService = createModelDiscoveryService(ctx);
    
    console.log('Starting model discovery process...');
    
    try {
      // Create discovery log entry
      const discoveryId = `discovery_${Date.now()}`;
      const startTime = Date.now();
      
      await ctx.runMutation(api.discovery.modelDiscovery.createDiscoveryLog, {
        discoveryId,
        status: 'running',
      });

      // Discover models
      const discoveredModels = await discoveryService.discoverVideoModels();
      
      console.log(`Discovered ${discoveredModels.length} video models`);

      let updateResult = { updated: 0, added: 0, errors: [] };
      
      if (args.updateExisting !== false) {
        // Update existing models with discovered information
        updateResult = await discoveryService.updateExistingModels(discoveredModels);
        
        console.log(`Updated ${updateResult.updated} models, added ${updateResult.added} new models`);
      }

      // Update discovery log with results
      await ctx.runMutation(api.discovery.modelDiscovery.updateDiscoveryLog, {
        discoveryId,
        status: 'completed',
        modelsFound: discoveredModels.length,
        modelsUpdated: updateResult.updated,
        modelsAdded: updateResult.added,
        errors: updateResult.errors,
        duration: Date.now() - startTime,
      });

      return {
        discoveryId,
        modelsFound: discoveredModels.length,
        modelsUpdated: updateResult.updated,
        modelsAdded: updateResult.added,
        errors: updateResult.errors,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Model discovery failed:', error);
      
      // Update discovery log with error
      await ctx.runMutation(api.discovery.modelDiscovery.updateDiscoveryLog, {
        discoveryId: `discovery_${Date.now()}`,
        status: 'failed',
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
      });

      throw error;
    }
  },
});

/**
 * Action to discover and analyze a specific model
 */
export const discoverSpecificModel = action({
  args: {
    owner: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const discoveryService = createModelDiscoveryService(ctx);
    
    try {
      // Get the model from Replicate
      const model = await discoveryService['client'].getModel(args.owner, args.name);
      
      // Analyze if it's a video model
      const isVideoModel = discoveryService['isVideoGenerationModel'](model);
      
      if (!isVideoModel) {
        return {
          success: false,
          message: 'Model does not appear to be a video generation model',
          model: {
            id: `${args.owner}/${args.name}`,
            name: args.name,
            owner: args.owner,
            description: model.description,
          },
        };
      }

      // Get detailed information
      const detailedModel = await discoveryService['getDetailedModelInfo'](model);
      
      if (!detailedModel) {
        return {
          success: false,
          message: 'Failed to get detailed model information',
        };
      }

      // Update the model in our database
      const updateResult = await discoveryService.updateExistingModels([detailedModel]);
      
      return {
        success: true,
        model: detailedModel,
        updated: updateResult.updated > 0,
        added: updateResult.added > 0,
        errors: updateResult.errors,
      };

    } catch (error) {
      console.error(`Failed to discover model ${args.owner}/${args.name}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Mutation to create a discovery log entry
 */
export const createDiscoveryLog = mutation({
  args: {
    discoveryId: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("modelDiscoveryLogs", {
      discoveryId: args.discoveryId,
      startedAt: now,
      status: args.status,
      modelsFound: 0,
      modelsUpdated: 0,
      modelsAdded: 0,
      modelsRemoved: 0,
      errors: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Mutation to update a discovery log entry
 */
export const updateDiscoveryLog = mutation({
  args: {
    discoveryId: v.string(),
    status: v.optional(v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    )),
    modelsFound: v.optional(v.number()),
    modelsUpdated: v.optional(v.number()),
    modelsAdded: v.optional(v.number()),
    modelsRemoved: v.optional(v.number()),
    errors: v.optional(v.array(v.string())),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_discovery_id", (q) => q.eq("discoveryId", args.discoveryId))
      .first();

    if (!log) {
      throw new Error(`Discovery log not found: ${args.discoveryId}`);
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.status) updateData.status = args.status;
    if (args.modelsFound !== undefined) updateData.modelsFound = args.modelsFound;
    if (args.modelsUpdated !== undefined) updateData.modelsUpdated = args.modelsUpdated;
    if (args.modelsAdded !== undefined) updateData.modelsAdded = args.modelsAdded;
    if (args.modelsRemoved !== undefined) updateData.modelsRemoved = args.modelsRemoved;
    if (args.errors) updateData.errors = args.errors;
    if (args.duration !== undefined) updateData.duration = args.duration;

    if (args.status === 'completed' || args.status === 'failed') {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(log._id, updateData);
  },
});

/**
 * Query to get discovery logs
 */
export const getDiscoveryLogs = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("modelDiscoveryLogs");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Query to get the latest discovery log
 */
export const getLatestDiscoveryLog = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_started_at", (q) => q)
      .order("desc")
      .first();
  },
});

/**
 * Query to get discovery statistics
 */
export const getDiscoveryStats = query({
  args: {
    timeWindow: v.optional(v.string()), // '24h', '7d', '30d'
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || '30d';
    const now = Date.now();
    
    let startTime: number;
    switch (timeWindow) {
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }

    const logs = await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_started_at", (q) => q.gte("startedAt", startTime))
      .collect();

    const stats = {
      totalDiscoveries: logs.length,
      completedDiscoveries: logs.filter(l => l.status === 'completed').length,
      failedDiscoveries: logs.filter(l => l.status === 'failed').length,
      runningDiscoveries: logs.filter(l => l.status === 'running').length,
      totalModelsFound: logs.reduce((sum, l) => sum + (l.modelsFound || 0), 0),
      totalModelsAdded: logs.reduce((sum, l) => sum + (l.modelsAdded || 0), 0),
      totalModelsUpdated: logs.reduce((sum, l) => sum + (l.modelsUpdated || 0), 0),
      averageDuration: logs.filter(l => l.duration).length > 0 
        ? logs.filter(l => l.duration).reduce((sum, l) => sum + l.duration!, 0) / logs.filter(l => l.duration).length
        : 0,
      lastDiscovery: logs.length > 0 ? Math.max(...logs.map(l => l.startedAt)) : null,
    };

    return stats;
  },
});

/**
 * Query to check if discovery is currently running
 */
export const isDiscoveryRunning = query({
  args: {},
  handler: async (ctx) => {
    const runningDiscovery = await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .first();

    return !!runningDiscovery;
  },
});

/**
 * Mutation to mark stale running discoveries as failed
 */
export const cleanupStaleDiscoveries = mutation({
  args: {
    maxAgeHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = (args.maxAgeHours || 2) * 60 * 60 * 1000; // Default 2 hours
    const cutoffTime = Date.now() - maxAge;

    const staleDiscoveries = await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .filter((q) => q.lt(q.field("startedAt"), cutoffTime))
      .collect();

    let cleanedUp = 0;
    for (const discovery of staleDiscoveries) {
      await ctx.db.patch(discovery._id, {
        status: 'failed',
        errors: ['Discovery timed out - marked as failed during cleanup'],
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });
      cleanedUp++;
    }

    return { cleanedUp };
  },
});