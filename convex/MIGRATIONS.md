# Convex Migrations Guide

This document explains how to use the new migration system that follows Convex best practices.

## Overview

We've refactored the migration system to follow Convex's schema-first approach:

1. **Schema changes** are handled automatically by Convex
2. **Data migrations** are handled through focused functions
3. **Initialization** is separate from migrations

## File Structure

- `convex/init.ts` - Simplified initialization only
- `convex/migrations.ts` - Focused data migration functions
- `convex/schema.ts` - Schema definition (handles structural changes automatically)

## Running Migrations

### 1. Database Initialization

For new databases, run the initialization:

```bash
npx convex run api.init
```

This will:
- Create default configurations
- Initialize AI models
- Set up credit packages and subscription plans
- Create model parameters

### 2. Data Migrations

Run specific migrations as needed:

```bash
# Migrate video parameters
npx convex run api.migrations.migrateVideoParameters

# Clean up deprecated video fields
npx convex run api.migrations.cleanupVideoFields

# Restructure parameter tables
npx convex run api.migrations.migrateParameterStructure

# Ensure model parameters are populated
npx convex run api.migrations.ensureModelParametersPopulated

# Analyze storage distribution
npx convex run api.migrations.analyzeStorageDistribution
```

## Migration Functions

### `migrateVideoParameters`
- Creates `modelParameters` records for existing videos
- Maps frontend parameters to API parameters based on model type
- Returns: success status, counts of created/existing records, error count

### `cleanupVideoFields`
- Removes deprecated fields from video records
- Handles: thumbnail fields, title fields, CDN URL fields
- Returns: success status, counts of removed fields, error count

### `migrateParameterStructure`
- Moves old `modelParameters` data to `videoParameters` table
- Restructures parameter storage for better organization
- Returns: success status, migrated record count, error count

### `ensureModelParametersPopulated`
- Ensures all models have parameter definitions
- Creates missing parameter records for models
- Returns: success status, processed models count, created parameters count

### `analyzeStorageDistribution`
- Analyzes video storage distribution (R2 vs Convex storage)
- Read-only query for monitoring
- Returns: counts of videos in different storage systems

## Schema Changes

For structural changes, simply update `convex/schema.ts`:

```typescript
// Add new field
videos: defineTable({
  newField: v.optional(v.string()),
  // ... existing fields
})

// Remove field - just delete it from schema
// Convex will automatically handle the removal

// Change field type - update the validator
// Convex will handle type conversion
```

## Best Practices

1. **Schema-first**: Always update schema.ts for structural changes
2. **Focused migrations**: Each migration function handles one specific task
3. **Error handling**: All migrations include proper error handling and reporting
4. **Idempotent**: Migrations can be run multiple times safely
5. **Monitoring**: Use the return values to monitor migration progress

## Migration Workflow

1. **Development**: Test migrations locally first
2. **Staging**: Run migrations on staging environment
3. **Production**: Run migrations during maintenance window
4. **Monitoring**: Check logs and return values for success/failure

## Example Workflow

```bash
# 1. Initialize new database
npx convex run api.init

# 2. Run data migrations as needed
npx convex run api.migrations.migrateVideoParameters
npx convex run api.migrations.cleanupVideoFields

# 3. Monitor results
npx convex run api.migrations.analyzeStorageDistribution
```

## Troubleshooting

### Migration Fails
- Check the error message in the return value
- Review logs for specific failure details
- Run individual migrations to isolate issues

### Schema Conflicts
- Ensure schema.ts is up to date
- Deploy schema changes before running data migrations
- Use `npx convex dev` to see schema validation errors

### Performance Issues
- Large datasets may take time to migrate
- Monitor progress through return values
- Consider running migrations during low-traffic periods

## Rollback Strategy

Since Convex doesn't support traditional rollbacks:

1. **Schema changes**: Revert schema.ts and redeploy
2. **Data migrations**: Create reverse migration functions if needed
3. **Backup**: Use `npx convex export` before major migrations
4. **Testing**: Always test migrations on staging first

## Monitoring

Use the return values from migration functions to monitor progress:

```typescript
const result = await ctx.runMutation(api.migrations.migrateVideoParameters, {});
console.log(`Migration completed: ${result.parametersCreated} created, ${result.errors} errors`);
```

This approach follows Convex best practices and provides a clean, maintainable migration system. 