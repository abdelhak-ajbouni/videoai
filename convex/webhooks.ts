import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get a processed webhook event by event ID and source
 */
export const getProcessedWebhook = query({
  args: {
    eventId: v.string(),
    source: v.string()
  },
  handler: async (ctx, { eventId, source }) => {
    return await ctx.db
      .query("processedWebhooks")
      .withIndex("by_event_id", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("source"), source))
      .first();
  },
});

/**
 * Mark a webhook event as processed
 */
export const markWebhookProcessed = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    source: v.string(),
    processed: v.boolean(),
    processedAt: v.number(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number()
  },
  handler: async (ctx, args) => {
    // Check if already exists to prevent duplicates
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("source"), args.source))
      .first();

    if (existing) {
      console.log(`Webhook event ${args.eventId} already tracked, updating status`);
      await ctx.db.patch(existing._id, {
        processed: args.processed,
        processedAt: args.processedAt,
        errorMessage: args.errorMessage,
        metadata: args.metadata
      });
      return existing._id;
    }

    return await ctx.db.insert("processedWebhooks", {
      eventId: args.eventId,
      eventType: args.eventType,
      source: args.source,
      processed: args.processed,
      processedAt: args.processedAt,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      createdAt: args.createdAt
    });
  },
});

/**
 * Get webhook processing statistics
 */
export const getWebhookStats = query({
  args: {
    source: v.optional(v.string()),
    timeRange: v.optional(v.number()) // Hours to look back
  },
  handler: async (ctx, { source, timeRange = 24 }) => {
    const cutoffTime = Date.now() - (timeRange * 60 * 60 * 1000);
    
    let query = ctx.db.query("processedWebhooks");
    
    if (source) {
      query = query.filter((q) => q.eq(q.field("source"), source));
    }
    
    const events = await query
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    const stats = {
      total: events.length,
      successful: events.filter(e => e.processed).length,
      failed: events.filter(e => !e.processed).length,
      byType: {} as Record<string, number>,
      recentFailures: events
        .filter(e => !e.processed)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map(e => ({
          eventId: e.eventId,
          eventType: e.eventType,
          errorMessage: e.errorMessage,
          createdAt: e.createdAt
        }))
    };

    // Count by event type
    events.forEach(event => {
      stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;
    });

    return stats;
  },
});

/**
 * Clean up old webhook tracking records (run via cron)
 */
export const cleanupOldWebhookRecords = mutation({
  args: {
    olderThanDays: v.number()
  },
  handler: async (ctx, { olderThanDays }) => {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    const oldRecords = await ctx.db
      .query("processedWebhooks")
      .filter((q) => q.lt(q.field("createdAt"), cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} old webhook records older than ${olderThanDays} days`);
    return deletedCount;
  },
});