# Convex Backend

This directory contains the Convex backend for the VideoAI application, including database schema, mutations, queries, and seeding logic.

## Database Schema

The application uses the following main tables:

- **users**: User accounts with credit and subscription management
- **videos**: Video generation records and metadata
- **creditTransactions**: Credit purchase and usage tracking
- **creditPackages**: Predefined credit packages for purchase
- **subscriptionPlans**: Monthly subscription plans
- **subscriptions**: User subscription records
- **generationJobs**: Video generation job tracking
- **configurations**: System configuration and feature flags
- **models**: AI model definitions and capabilities

## Seeding System

The application includes a comprehensive seeding system that initializes all necessary data for the application to function properly.

### Main Seeding Function

The `convex/init.ts` file contains the main seeding function that initializes:

1. **System Configurations** - Business rules, pricing multipliers, feature flags, and system limits
2. **AI Models** - Google Veo-3, Luma Ray models with their capabilities and pricing
3. **Credit Packages** - Small, Medium, Large, and X-Large credit packages
4. **Subscription Plans** - Starter, Pro, and Business subscription tiers

### Running the Seeder

The seeding function is automatically run when you start the development server:

```bash
npm run dev
```

This will:
1. Run the Convex development server
2. Execute the `init` function to seed the database
3. Start the Next.js development server

You can also run the seeder manually:

```bash
npx convex dev --run init
```

### Seeding Safety

The seeding function is **idempotent** - it's safe to run multiple times. The function:

- Checks for existing data before inserting
- Only creates new records if they don't already exist
- Returns detailed results showing what was created vs. skipped
- Uses `internalMutation` to prevent public access

### Seeded Data

#### System Configurations

- **Business Rules**: Profit margin, credits per dollar, free tier credits
- **Pricing**: Quality multipliers for different video quality tiers
- **Models**: Configuration for all supported AI models
- **Features**: Feature flags for ultra quality, priority processing, API access
- **Limits**: Maximum prompt length, concurrent generations, video duration
- **Subscriptions**: Quality access rules for each subscription tier

#### AI Models

- **Google Veo-3**: Premium high-quality model (8-second fixed duration)
- **Luma Ray-2-720p**: Cost-effective model (5-9 second duration)
- **Luma Ray Flash 2-540p**: Ultra-fast budget model (default, 5-9 second duration)

#### Credit Packages

- **Small**: 100 credits for $20
- **Medium**: 250 credits for $45 (popular)
- **Large**: 500 credits for $80
- **X-Large**: 1000 credits for $150

#### Subscription Plans

- **Starter**: $9.99/month, 100 credits, HD quality
- **Pro**: $29.99/month, 500 credits, Ultra quality, priority processing
- **Business**: $99.99/month, 2000 credits, 4K quality, API access

### Environment Variables

The seeding system uses the following environment variables for Stripe price IDs:

- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_BUSINESS_PRICE_ID`

If these are not set, placeholder values will be used.

### Customization

To add new seeded data:

1. Add the data structure to the appropriate section in `convex/init.ts`
2. Include proper existence checks to maintain idempotency
3. Update the results tracking if needed
4. Test by running `npx convex dev --run init`

### Legacy Scripts

The following legacy scripts are still available but deprecated in favor of the new seeding system:

- `npm run init-configs` - Legacy configuration initialization
- `npm run init-models` - Legacy model initialization

These scripts will be removed in a future version.

## Development

### Adding New Tables

1. Define the table schema in `schema.ts`
2. Create corresponding mutation/query files
3. Add seeding logic to `init.ts` if needed
4. Update this README

### Testing

To test the seeding system:

```bash
# Clear the database (if needed)
npx convex dev --reset

# Run the seeder
npx convex dev --run init

# Check the results in the Convex dashboard
```

The seeder will return detailed results showing what was created and what was skipped. 