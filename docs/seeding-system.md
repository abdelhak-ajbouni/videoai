# VideoAI Seeding System

This document describes the comprehensive seeding system for the VideoAI application, which automatically initializes all necessary data for the application to function properly.

## Overview

The seeding system is designed to be:
- **Idempotent**: Safe to run multiple times without creating duplicate data
- **Comprehensive**: Seeds all necessary data types
- **Type-safe**: Uses TypeScript for compile-time validation
- **Secure**: Uses `internalMutation` to prevent public access
- **Automated**: Runs automatically during development

## Architecture

### Main Components

1. **`convex/init.ts`** - Main seeding function

### Data Types Seeded

| Data Type | Count | Description |
|-----------|-------|-------------|
| Configurations | 12 | System settings, business rules, feature flags |
| AI Models | 3 | Google Veo-3, Luma Ray models |
| Credit Packages | 4 | Small, Medium, Large, X-Large packages |
| Subscription Plans | 3 | Starter, Pro, Business plans |

## Usage

### Automatic Seeding

The seeding runs automatically when you start the development server:

```bash
npm run dev
```

This command:
1. Starts the Convex development server
2. Runs the `init` function to seed the database
3. Starts the Next.js development server

### Manual Seeding

You can run the seeder manually:

```bash
npx convex dev --run init
```

### Verification

You can verify seeded data by checking the database directly in the Convex dashboard or by querying the tables directly:

```bash
# View all configurations
npx convex run configurations:getAllConfigs

# View active models
npx convex run models:getActiveModels

# View active credit packages
npx convex run creditPackages:getActivePackages

# View active subscription plans
npx convex run subscriptionPlans:getActivePlans
```

## Seeded Data Details

### System Configurations

The system seeds 12 key configurations across multiple categories:

#### Business Rules
- `profit_margin`: Profit margin multiplier (1.32 = 32% markup)
- `credits_per_dollar`: Credits equivalent to $1 USD (50)
- `free_tier_credits`: Credits given to new users (10)

#### Pricing
- `quality_multipliers`: Cost multipliers for video quality tiers
  - Standard: 1.0x
  - High: 1.2x
  - Ultra: 1.5x

#### Feature Flags
- `enable_ultra_quality`: Whether ultra quality is available
- `enable_priority_processing`: Whether priority processing is available
- `enable_api_access`: Whether API access is available

#### System Limits
- `max_prompt_length`: Maximum prompt length (500 characters)
- `max_concurrent_generations`: Maximum concurrent generations (3)
- `max_video_duration`: Maximum video duration (60 seconds)

#### Subscription Access
- `subscription_quality_access`: Quality tiers available per subscription level

### AI Models

Three AI models are seeded with different capabilities:

#### Google Veo-3 (Premium)
- **Cost**: $0.75/second
- **Duration**: Fixed 8 seconds
- **Quality**: Standard, High, Ultra
- **Use Case**: High-quality professional content

#### Luma Ray-2-720p (Budget)
- **Cost**: $0.18/second
- **Duration**: 5-9 seconds
- **Quality**: Standard, High, Ultra
- **Use Case**: Cost-effective content creation

#### Luma Ray Flash 2-540p (Default)
- **Cost**: $0.12/second
- **Duration**: 5-9 seconds
- **Quality**: Standard, High, Ultra
- **Use Case**: Rapid prototyping and testing

### Credit Packages

Four credit packages for one-time purchases:

| Package | Credits | Price | Popular |
|---------|---------|-------|---------|
| Small | 100 | $20.00 | No |
| Medium | 250 | $45.00 | Yes |
| Large | 500 | $80.00 | No |
| X-Large | 1000 | $150.00 | No |

### Subscription Plans

Three monthly subscription tiers:

#### Starter ($9.99/month)
- 100 credits per month
- HD video quality
- Standard support
- Personal video library

#### Pro ($29.99/month) - Popular
- 500 credits per month
- HD + Ultra video quality
- Priority processing
- Advanced analytics
- Priority support

#### Business ($99.99/month)
- 2000 credits per month
- 4K video quality
- API access
- Team management
- Dedicated support
- Custom integrations

## Environment Variables

The seeding system uses these environment variables:

```bash
# Stripe Price IDs (optional - placeholders used if not set)
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx
```

## Development

### Adding New Seeded Data

To add new data to the seeding system:

1. **Add the data structure** to the appropriate section in `convex/init.ts`
2. **Include existence checks** to maintain idempotency
3. **Update results tracking** if needed
4. **Test the changes** by running `npx convex dev --run init`

Example:

```typescript
// In convex/init.ts
const newData = [
  {
    key: "new_config",
    category: "features",
    name: "New Feature",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  }
];

for (const item of newData) {
  const existing = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q) => q.eq("key", item.key))
    .first();

  if (!existing) {
    await ctx.db.insert("configurations", {
      ...item,
      createdAt: now,
      updatedAt: now,
    });
    results.configurations.created++;
  } else {
    results.configurations.skipped++;
  }
}
```

### Testing

To test the seeding system:

```bash
# Verify data integrity
npx convex run models:getActiveModels
npx convex run creditPackages:getActivePackages
npx convex run subscriptionPlans:getActivePlans
npx convex run configurations:getAllConfigs

# Reset database (if needed)
npx convex dev --reset
npx convex dev --run init
```

### Troubleshooting

#### Common Issues

1. **Seeding fails**: Check that Convex is running and accessible
2. **Duplicate data**: The system should prevent this, but check for manual inserts
3. **Missing data**: Run `npm run seed-status` to see what's missing

#### Debug Commands

```bash
# View all data types
npx convex run models:getActiveModels
npx convex run creditPackages:getActivePackages
npx convex run subscriptionPlans:getActivePlans
npx convex run configurations:getAllConfigs
```

## Security

- The seeding function uses `internalMutation` to prevent public access
- Only authorized server-side code can trigger seeding
- Environment variables are used for sensitive configuration
- All data is validated against the schema before insertion

## Performance

- Seeding is optimized to check for existing data before inserting
- Batch operations are used where possible
- The system returns detailed results for monitoring
- Idempotent design allows safe re-runs

## Migration Strategy

When updating seeded data:

1. **Add new data** with proper existence checks
2. **Deprecate old data** by setting `isActive: false`
3. **Test thoroughly** in development
4. **Deploy incrementally** to production
5. **Monitor results** using the verification tools

## Best Practices

1. **Always check for existing data** before inserting
2. **Use meaningful names and descriptions** for all seeded items
3. **Include proper validation** in the schema
4. **Test idempotency** by running the seeder multiple times
5. **Document changes** when adding new seeded data
6. **Use environment variables** for configuration that varies by environment
7. **Monitor seeding results** in production deployments 