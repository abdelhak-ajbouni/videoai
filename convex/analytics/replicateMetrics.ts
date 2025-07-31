import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { defaultPerformanceMonitor } from "../services/performanceMonitor";
import { ReplicateErrorType } from "../lib/replicateErrors";

/**
 * Record a successful Replicate API operation
 */
export const recordSuccess = mutation({
  args: {
    modelId: v.string(),
    operation: v.string(),
    duration: v.number(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await defaultPerformanceMonitor.recordSuccess(
      ctx,
      args.modelId,
      args.operation,
      args.duration,
      args.context
    );
  },
});

/**
 * Record a failed Replicate API operation
 */
export const recordFailure = mutation({
  args: {
    modelId: v.string(),
    operation: v.string(),
    error: v.any(),
    duration: v.optional(v.number()),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await defaultPerformanceMonitor.recordFailure(
      ctx,
      args.modelId,
      args.operation,
      args.error,
      args.duration,
      args.context
    );
  },
});

/**
 * Get current health status for a specific model
 */
export const getModelHealth = query({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    return await defaultPerformanceMonitor.getModelHealth(ctx, args.modelId);
  },
});

/**
 * Get comprehensive statistics for a model
 */
export const getModelStatistics = query({
  args: {
    modelId: v.string(),
    timeWindow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await defaultPerformanceMonitor.getModelStatistics(
      ctx,
      args.modelId,
      args.timeWindow || '24h'
    );
  },
});

/**
 * Get health status for all models
 */
export const getAllModelsHealth = query({
  args: {},
  handler: async (ctx) => {
    return await defaultPerformanceMonitor.getAllModelsHealth(ctx);
  },
});

/**
 * Get health alerts for models that need attention
 */
export const getHealthAlerts = query({
  args: {},
  handler: async (ctx) => {
    return await defaultPerformanceMonitor.getHealthAlerts(ctx);
  },
});

/**
 * Get recent metrics for a model (for debugging/analysis)
 */
export const getRecentMetrics = query({
  args: {
    modelId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    return await ctx.db
      .query("replicateMetrics")
      .withIndex("by_model_and_timestamp", (q) =>
        q.eq("modelId", args.modelId)
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Get error breakdown for a model over a time period
 */
export const getErrorBreakdown = query({
  args: {
    modelId: v.string(),
    timeWindow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || '24h';
    const now = Date.now();
    const windowMs = parseTimeWindow(timeWindow);
    const startTime = now - windowMs;

    const metrics = await ctx.db
      .query("replicateMetrics")
      .withIndex("by_model_and_timestamp", (q) =>
        q.eq("modelId", args.modelId).gte("timestamp", startTime)
      )
      .collect();

    const errorBreakdown: Record<string, { count: number; percentage: number }> = {};
    const failedMetrics = metrics.filter(m => !m.success);
    const totalFailed = failedMetrics.length;

    if (totalFailed === 0) {
      return errorBreakdown;
    }

    // Count errors by type
    const errorCounts: Record<string, number> = {};
    failedMetrics.forEach(metric => {
      const errorType = metric.errorType || 'unknown';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    // Calculate percentages
    Object.entries(errorCounts).forEach(([errorType, count]) => {
      errorBreakdown[errorType] = {
        count,
        percentage: (count / totalFailed) * 100,
      };
    });

    return errorBreakdown;
  },
});

/**
 * Get performance trends over time
 */
export const getPerformanceTrends = query({
  args: {
    modelId: v.string(),
    timeWindow: v.optional(v.string()),
    granularity: v.optional(v.union(v.literal("hour"), v.literal("day"))),
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || '7d';
    const granularity = args.granularity || 'hour';
    const now = Date.now();
    const windowMs = parseTimeWindow(timeWindow);
    const startTime = now - windowMs;

    const metrics = await ctx.db
      .query("replicateMetrics")
      .withIndex("by_model_and_timestamp", (q) =>
        q.eq("modelId", args.modelId).gte("timestamp", startTime)
      )
      .collect();

    // Group metrics by time buckets
    const bucketSize = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const buckets: Record<number, typeof metrics> = {};

    metrics.forEach(metric => {
      const bucketTime = Math.floor(metric.timestamp / bucketSize) * bucketSize;
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = [];
      }
      buckets[bucketTime].push(metric);
    });

    // Calculate trends for each bucket
    const trends = Object.entries(buckets)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([timestamp, bucketMetrics]) => {
        const total = bucketMetrics.length;
        const successful = bucketMetrics.filter(m => m.success).length;
        const successRate = total > 0 ? (successful / total) * 100 : 100;

        const responseTimes = bucketMetrics
          .filter(m => m.success && m.duration > 0)
          .map(m => m.duration);
        
        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

        return {
          timestamp: parseInt(timestamp),
          totalRequests: total,
          successRate,
          avgResponseTime,
        };
      });

    return trends;
  },
});

/**
 * Action to perform comprehensive health check on all models
 */
export const performHealthCheck = action({
  args: {},
  handler: async (ctx) => {
    console.log('Starting weekly model health check...');
    
    try {
      // Get all health data
      const allHealth = await defaultPerformanceMonitor.getAllModelsHealth(ctx);
      
      // Get health alerts
      const alerts = await defaultPerformanceMonitor.getHealthAlerts(ctx);
      
      // Log summary
      const healthyModels = allHealth.filter(h => h.isHealthy).length;
      const unhealthyModels = allHealth.length - healthyModels;
      
      console.log(`Health check complete: ${healthyModels} healthy, ${unhealthyModels} unhealthy models`);
      
      if (alerts.length > 0) {
        console.warn(`Found ${alerts.length} health alerts:`, alerts.map(a => `${a.modelId}: ${a.message}`));
      }
      
      return {
        totalModels: allHealth.length,
        healthyModels,
        unhealthyModels,
        alerts: alerts.length,
        timestamp: Date.now(),
      };
      
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
});

/**
 * Helper function to parse time window strings
 */
function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(/^(\d+)([hd])$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}