import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily model discovery job
 * Runs every day at 2 AM UTC to discover new video models
 */
crons.daily(
  "daily-model-discovery",
  {
    hourUTC: 2, // 2 AM UTC
    minuteUTC: 0,
  },
  api.discovery.modelDiscovery.discoverModels,
  {
    maxModels: 1000,
    updateExisting: true,
  }
);

/**
 * Weekly comprehensive model discovery
 * Runs every Sunday at 3 AM UTC for a more thorough discovery
 */
crons.weekly(
  "weekly-comprehensive-discovery",
  {
    dayOfWeek: "sunday",
    hourUTC: 3,
    minuteUTC: 0,
  },
  api.discovery.modelDiscovery.discoverModels,
  {
    maxModels: 2000,
    updateExisting: true,
  }
);

/**
 * Cleanup stale discovery processes
 * Runs every 6 hours to clean up any stuck discovery processes
 */
crons.interval(
  "cleanup-stale-discoveries",
  { hours: 6 },
  api.discovery.modelDiscovery.cleanupStaleDiscoveries,
  {
    maxAgeHours: 4, // Mark discoveries as failed if running for more than 4 hours
  }
);

/**
 * Monthly cleanup of old discovery logs
 * Runs on the 1st of each month at 1 AM UTC
 */
crons.monthly(
  "cleanup-old-discovery-logs",
  {
    day: 1,
    hourUTC: 1,
    minuteUTC: 0,
  },
  api.migrations.modelDiscoveryMigration.cleanupOldDiscoveryLogs,
  {
    maxAgedays: 90, // Keep logs for 90 days
  }
);

/**
 * Weekly model health check
 * Runs every Wednesday at 4 AM UTC to validate model health
 */
crons.weekly(
  "weekly-model-health-check",
  {
    dayOfWeek: "wednesday",
    hourUTC: 4,
    minuteUTC: 0,
  },
  api.analytics.replicateMetrics.performHealthCheck
);

export default crons;