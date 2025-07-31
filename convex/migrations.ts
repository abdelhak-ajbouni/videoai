import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Migration to add new fields to existing videos
export const migrateVideoSchema = mutation({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("videos").collect();

    let updatedCount = 0;

    for (const video of videos) {
      const updates: {
        viewCount?: number;
        downloadCount?: number;
        shareCount?: number;
        isPublic?: boolean;
        isFavorite?: boolean;
        updatedAt: number;
      } = { updatedAt: Date.now() };

      // Add missing analytics fields
      if (video.viewCount === undefined) updates.viewCount = 0;
      if (video.downloadCount === undefined) updates.downloadCount = 0;
      if (video.shareCount === undefined) updates.shareCount = 0;

      // Add missing content management fields
      if (video.isPublic === undefined) updates.isPublic = false;
      if (video.isFavorite === undefined) updates.isFavorite = false;

      // Only update if there are missing fields
      if (Object.keys(updates).length > 1) {
        // More than just updatedAt
        await ctx.db.patch(video._id, updates);
        updatedCount++;
      }
    }

    return { updatedCount, totalVideos: videos.length };
  },
});

// Migration to calculate file sizes for existing videos (if videoUrl exists)
export const calculateMissingFileSizes = mutation({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db
      .query("videos")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.neq(q.field("videoUrl"), undefined),
          q.eq(q.field("fileSize"), undefined)
        )
      )
      .collect();

    let updatedCount = 0;

    // Note: This would require actual HTTP requests to get file sizes
    // For now, we'll estimate based on quality and duration
    for (const video of videos) {
      const estimatedSize = estimateFileSize(video.quality, video.duration);

      await ctx.db.patch(video._id, {
        fileSize: estimatedSize,
        format: "mp4",
        codec: "h264",
        dimensions:
          video.quality === "high"
            ? { width: 1920, height: 1080 }
            : { width: 1280, height: 720 },
        actualDuration: parseInt(video.duration),
        updatedAt: Date.now(),
      });

      updatedCount++;
    }

    return { updatedCount, totalVideos: videos.length };
  },
});

// Migration to add model field to existing videos
export const addModelFieldToVideos = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all videos that don't have a model field
    const videos = await ctx.db.query("videos").collect();

    let updatedCount = 0;

    for (const video of videos) {
      if (!video.model) {
        // Update the video with the default model
        await ctx.db.patch(video._id, {
          model: "luma/ray-flash-2-540p", // Default to cheapest model for existing videos
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} videos with default model`);
    return { updatedCount };
  },
});

// Migration to fix invalid duration values
export const fixInvalidDurations = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all videos with invalid duration values
    const videos = await ctx.db.query("videos").collect();

    let updatedCount = 0;

    for (const video of videos) {
      const currentDuration = video.duration as string;
      let newDuration: "5" | "8" | "9" = "8"; // Default to 8s

      // Convert old duration values to valid ones
      if (currentDuration === "15") {
        newDuration = "8"; // Convert 15s to 8s (Google Veo-3 default)
      } else if (currentDuration === "30") {
        newDuration = "9"; // Convert 30s to 9s (Luma Ray-2 max)
      } else if (currentDuration === "60") {
        newDuration = "9"; // Convert 60s to 9s (Luma Ray-2 max)
      }

      // Update if duration changed
      if (currentDuration !== newDuration) {
        await ctx.db.patch(video._id, {
          duration: newDuration,
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} videos with valid duration values`);
    return { updatedCount };
  },
});

// Migration to initialize default subscription plans
export const initializeSubscriptionPlans: any = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting subscription plans migration...");

    // Initialize default plans
    const planIds = await ctx.runMutation(
      api.subscriptionPlans.initializeDefaultPlans,
      {}
    );

    console.log(`Initialized ${planIds.length} subscription plans:`, planIds);

    return planIds;
  },
});

// Migration to initialize default credit packages
export const initializeCreditPackages: any = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting credit packages migration...");

    // Initialize default packages
    const packageIds = await ctx.runMutation(
      api.creditPackages.initializeDefaultPackages,
      {}
    );

    console.log(
      `Initialized ${packageIds.length} credit packages:`,
      packageIds
    );

    return packageIds;
  },
});

// Migration to update existing subscriptions to use new tier format
export const migrateSubscriptionTiers = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting subscription tiers migration...");

    // Get all existing subscriptions
    const subscriptions = await ctx.db.query("subscriptions").collect();

    let updatedCount = 0;

    for (const subscription of subscriptions) {
      // Check if tier is already a string (new format)
      if (typeof subscription.tier === "string") {
        continue; // Already migrated
      }

      // Convert old union type to string
      await ctx.db.patch(subscription._id, {
        tier: subscription.tier as string,
      });

      updatedCount++;
    }

    console.log(`Migrated ${updatedCount} subscription tiers`);

    return updatedCount;
  },
});

// Migration script to move data from users table to userProfiles table
export const migrateUsersToUserProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration from users to userProfiles...");
    
    // Get all users from the old users table
    const users = await ctx.db.query("users").collect();
    console.log(`Found ${users.length} users to migrate`);
    
    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
    };
    
    for (const user of users) {
      try {
        // Check if userProfile already exists
        const existingProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", user.clerkId))
          .first();
        
        if (existingProfile) {
          console.log(`Skipping user ${user.clerkId} - profile already exists`);
          results.skipped++;
          continue;
        }
        
        // Create new userProfile record
        await ctx.db.insert("userProfiles", {
          clerkId: user.clerkId,
          credits: user.credits,
          totalCreditsUsed: user.totalCreditsUsed,
          createdAt: user.createdAt,
          updatedAt: Date.now(),
        });
        
        console.log(`Migrated user ${user.clerkId}`);
        results.migrated++;
        
      } catch (error) {
        console.error(`Error migrating user ${user.clerkId}:`, error);
        results.errors++;
      }
    }
    
    console.log("Migration complete:", results);
    return results;
  },
});

// Migration to update videos table from userId to clerkId
export const migrateVideosToClerkId = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration of videos table to use clerkId...");
    
    // Get all videos that still use userId
    const videos = await ctx.db.query("videos").collect();
    console.log(`Found ${videos.length} videos to check`);
    
    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
    };
    
    for (const video of videos) {
      try {
        // Check if video already has clerkId (in case of partial migration)
        if ((video as any).clerkId) {
          results.skipped++;
          continue;
        }
        
        // Get the user to find their clerkId
        const user = await ctx.db.get((video as any).userId);
        if (!user) {
          console.error(`User not found for video ${video._id}`);
          results.errors++;
          continue;
        }
        
        // Update video with clerkId and remove userId
        const { userId, ...videoWithoutUserId } = video as any;
        await ctx.db.replace(video._id, {
          ...videoWithoutUserId,
          clerkId: user.clerkId,
        });
        
        console.log(`Migrated video ${video._id}`);
        results.migrated++;
        
      } catch (error) {
        console.error(`Error migrating video ${video._id}:`, error);
        results.errors++;
      }
    }
    
    console.log("Videos migration complete:", results);
    return results;
  },
});

// Migration to update creditTransactions table from userId to clerkId
export const migrateCreditTransactionsToClerkId = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration of creditTransactions table to use clerkId...");
    
    const transactions = await ctx.db.query("creditTransactions").collect();
    console.log(`Found ${transactions.length} transactions to check`);
    
    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
    };
    
    for (const transaction of transactions) {
      try {
        // Check if transaction already has clerkId
        if ((transaction as any).clerkId) {
          results.skipped++;
          continue;
        }
        
        // Get the user to find their clerkId
        const user = await ctx.db.get((transaction as any).userId);
        if (!user) {
          console.error(`User not found for transaction ${transaction._id}`);
          results.errors++;
          continue;
        }
        
        // Update transaction with clerkId and remove userId
        const { userId, ...transactionWithoutUserId } = transaction as any;
        await ctx.db.replace(transaction._id, {
          ...transactionWithoutUserId,
          clerkId: user.clerkId,
        });
        
        console.log(`Migrated transaction ${transaction._id}`);
        results.migrated++;
        
      } catch (error) {
        console.error(`Error migrating transaction ${transaction._id}:`, error);
        results.errors++;
      }
    }
    
    console.log("Credit transactions migration complete:", results);
    return results;
  },
});

// Migration to update subscriptions table from userId to clerkId
export const migrateSubscriptionsToClerkId = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration of subscriptions table to use clerkId...");
    
    const subscriptions = await ctx.db.query("subscriptions").collect();
    console.log(`Found ${subscriptions.length} subscriptions to check`);
    
    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
    };
    
    for (const subscription of subscriptions) {
      try {
        // Check if subscription already has clerkId
        if ((subscription as any).clerkId) {
          results.skipped++;
          continue;
        }
        
        // Get the user to find their clerkId
        const user = await ctx.db.get((subscription as any).userId);
        if (!user) {
          console.error(`User not found for subscription ${subscription._id}`);
          results.errors++;
          continue;
        }
        
        // Update subscription with clerkId and remove userId
        const { userId, ...subscriptionWithoutUserId } = subscription as any;
        await ctx.db.replace(subscription._id, {
          ...subscriptionWithoutUserId,
          clerkId: user.clerkId,
        });
        
        console.log(`Migrated subscription ${subscription._id}`);
        results.migrated++;
        
      } catch (error) {
        console.error(`Error migrating subscription ${subscription._id}:`, error);
        results.errors++;
      }
    }
    
    console.log("Subscriptions migration complete:", results);
    return results;
  },
});

// Migration to update generationJobs table from userId to clerkId
export const migrateGenerationJobsToClerkId = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration of generationJobs table to use clerkId...");
    
    const jobs = await ctx.db.query("generationJobs").collect();
    console.log(`Found ${jobs.length} generation jobs to check`);
    
    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
    };
    
    for (const job of jobs) {
      try {
        // Check if job already has clerkId
        if ((job as any).clerkId) {
          results.skipped++;
          continue;
        }
        
        // Get the user to find their clerkId
        const user = await ctx.db.get((job as any).userId);
        if (!user) {
          console.error(`User not found for generation job ${job._id}`);
          results.errors++;
          continue;
        }
        
        // Update job with clerkId and remove userId
        const { userId, ...jobWithoutUserId } = job as any;
        await ctx.db.replace(job._id, {
          ...jobWithoutUserId,
          clerkId: user.clerkId,
        });
        
        console.log(`Migrated generation job ${job._id}`);
        results.migrated++;
        
      } catch (error) {
        console.error(`Error migrating generation job ${job._id}:`, error);
        results.errors++;
      }
    }
    
    console.log("Generation jobs migration complete:", results);
    return results;
  },
});

// Run all migrations in sequence
export const runAllMigrations = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Running all database migrations...");
    
    try {
      // Step 1: Create userProfiles from users
      const userProfilesResult = await ctx.runMutation(api.migrations.migrateUsersToUserProfiles, {});
      console.log("UserProfiles migration:", userProfilesResult);
      
      // Step 2: Update videos table
      const videosResult = await ctx.runMutation(api.migrations.migrateVideosToClerkId, {});
      console.log("Videos migration:", videosResult);
      
      // Step 3: Update creditTransactions table
      const transactionsResult = await ctx.runMutation(api.migrations.migrateCreditTransactionsToClerkId, {});
      console.log("Credit transactions migration:", transactionsResult);
      
      // Step 4: Update subscriptions table
      const subscriptionsResult = await ctx.runMutation(api.migrations.migrateSubscriptionsToClerkId, {});
      console.log("Subscriptions migration:", subscriptionsResult);
      
      // Step 5: Update generationJobs table
      const jobsResult = await ctx.runMutation(api.migrations.migrateGenerationJobsToClerkId, {});
      console.log("Generation jobs migration:", jobsResult);
      
      const totalResults = {
        userProfiles: userProfilesResult,
        videos: videosResult,
        creditTransactions: transactionsResult,
        subscriptions: subscriptionsResult,
        generationJobs: jobsResult,
      };
      
      console.log("All migrations completed successfully!");
      return totalResults;
      
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  },
});

// Remove priceId fields from subscription plans
export const removePriceIdFromPlans = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Removing priceId fields from subscription plans...");
    
    const plans = await ctx.db.query("subscriptionPlans").collect();
    console.log(`Found ${plans.length} plans to update`);
    
    const results = {
      updated: 0,
      skipped: 0,
      errors: 0,
    };
    
    for (const plan of plans) {
      try {
        // Check if plan has priceId field
        if ((plan as any).priceId) {
          // Remove priceId field and update
          const { priceId, ...planWithoutPriceId } = plan as any;
          await ctx.db.replace(plan._id, {
            ...planWithoutPriceId,
            updatedAt: Date.now(),
          });
          
          console.log(`Removed priceId from plan ${plan.planId}`);
          results.updated++;
        } else {
          results.skipped++;
        }
        
      } catch (error) {
        console.error(`Error updating plan ${plan.planId}:`, error);
        results.errors++;
      }
    }
    
    console.log("PriceId removal complete:", results);
    return results;
  },
});

// Check migration status
export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userCount = await ctx.db.query("users").collect().then(r => r.length).catch(() => 0);
    const userProfilesCount = await ctx.db.query("userProfiles").collect().then(r => r.length);
    
    // Check if any tables still have userId fields
    const videosWithUserId = await ctx.db.query("videos").collect()
      .then(videos => videos.filter(v => (v as any).userId && !(v as any).clerkId).length);
    
    const transactionsWithUserId = await ctx.db.query("creditTransactions").collect()
      .then(transactions => transactions.filter(t => (t as any).userId && !(t as any).clerkId).length);
    
    const subscriptionsWithUserId = await ctx.db.query("subscriptions").collect()
      .then(subscriptions => subscriptions.filter(s => (s as any).userId && !(s as any).clerkId).length);
    
    const jobsWithUserId = await ctx.db.query("generationJobs").collect()
      .then(jobs => jobs.filter(j => (j as any).userId && !(j as any).clerkId).length);
    
    // Check if any plans still have priceId fields
    const plansWithPriceId = await ctx.db.query("subscriptionPlans").collect()
      .then(plans => plans.filter(p => (p as any).priceId).length);
    
    return {
      users: userCount,
      userProfiles: userProfilesCount,
      needsMigration: {
        videos: videosWithUserId,
        creditTransactions: transactionsWithUserId,
        subscriptions: subscriptionsWithUserId,
        generationJobs: jobsWithUserId,
        subscriptionPlans: plansWithPriceId,
      },
      migrationComplete: videosWithUserId === 0 && transactionsWithUserId === 0 && 
                        subscriptionsWithUserId === 0 && jobsWithUserId === 0 && plansWithPriceId === 0,
    };
  },
});

// Helper function to estimate file size
function estimateFileSize(quality: string, duration: string): number {
  const durationNum = parseInt(duration);

  // Rough estimates in bytes (bitrate * duration)
  const bitrateEstimates = {
    standard: 2000000, // 2 Mbps
    high: 5000000, // 5 Mbps
    ultra: 10000000, // 10 Mbps
  };

  const bitrate =
    bitrateEstimates[quality as keyof typeof bitrateEstimates] || 2000000;

  // Convert bitrate to bytes per second and multiply by duration
  return Math.round((bitrate / 8) * durationNum);
}
