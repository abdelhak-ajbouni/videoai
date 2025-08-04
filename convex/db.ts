/**
 * DATABASE UTILITY FUNCTIONS
 * 
 * This file contains utility functions for database management:
 * - Clearing tables
 * - Database maintenance
 * - Development utilities
 * 
 * These are NOT for seeding or migrations.
 * Use seed.ts for populating data and proper migration files for production changes.
 */

import { internalMutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Clear all tables for fresh start (dev mode only)
export const clearDatabase = internalMutation({
  handler: async (ctx: MutationCtx) => {
    console.log("🗑️ Clearing all database tables...");
    
    const tables = [
      "models", 
      "modelParameters", 
      "videoParameters",
      "videos", 
      "userProfiles", 
      "creditTransactions",
      "creditPackages",
      "subscriptionPlans", 
      "subscriptions",
      "configurations"
    ];
    
    for (const tableName of tables) {
      const records = await ctx.db.query(tableName as any).collect();
      console.log(`Deleting ${records.length} records from ${tableName}`);
      
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }
    
    console.log("✅ Database cleared successfully");
    return "Database cleared";
  },
});

// Clear specific table (dev mode only)
export const clearTable = internalMutation({
  args: {
    tableName: v.string(),
  },
  handler: async (ctx: MutationCtx, { tableName }) => {
    console.log(`🗑️ Clearing table: ${tableName}...`);
    
    const records = await ctx.db.query(tableName as any).collect();
    console.log(`Deleting ${records.length} records from ${tableName}`);
    
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    
    console.log(`✅ Table ${tableName} cleared successfully`);
    return `Table ${tableName} cleared`;
  },
});