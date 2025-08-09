# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Veymo.ai is a SaaS platform for AI-powered video generation from text prompts. The platform features multiple AI models, credit-based pricing, subscription management, and Stripe payments.

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Convex (real-time database & serverless functions)
- **Authentication**: Clerk
- **Payments**: Stripe
- **AI Integration**: Replicate API (video generation models)
- **File Storage**: Convex R2 integration
- **UI Components**: Radix UI primitives with custom styling

## Development Commands

### Essential Commands
```bash
# Setup and Development
npm install                    # Install dependencies
npm run predev                # Initialize database with seed data (runs automatically before dev)
npm run dev                   # Start development server (localhost:3001)

# Database Operations
npm run db:clear              # Clear all database data
npm run db:seed               # Seed database with initial data
npm run db:reset              # Clear and reseed database
npx convex dashboard          # Open Convex database dashboard

# Testing and Quality
npm run lint                  # Run ESLint
npm test                      # Run Jest tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate test coverage report

# Production
npm run build                # Build for production
npm run start                # Start production server

# Environment Mode Switching
npm run dev-mode             # Switch to development mode
npm run prod-mode            # Switch to production mode
npm run check-mode           # Check current mode
```

## Architecture Overview

### Database Schema (Convex)

**Core Tables:**
- `userProfiles` - User credit balances and usage tracking (linked to Clerk)
- `videos` - Video generation requests, metadata, and processing status
- `videoParameters` - Model-specific parameters for each video generation
- `models` - Available AI models and their configurations
- `modelParameters` - Dynamic parameter definitions per model
- `modelCosts` - Resolution-based pricing for each model

**Commerce Tables:**
- `creditPackages` - One-time credit purchase options
- `creditTransactions` - All credit additions/deductions with audit trail
- `subscriptionPlans` - Monthly subscription tiers
- `subscriptions` - User subscription status (synced with Stripe)
- `subscriptionItems` - Stripe subscription item details

**Configuration:**
- `configurations` - System-wide configuration values by category

### Key Business Logic

**Video Generation Flow:**
1. User submits prompt + model selection via `VideoGenerationForm`
2. `videos.generateVideo` mutation validates credits and creates video record
3. Replicate API job initiated in background action
4. Webhook handler (`api/webhooks/replicate`) processes completion
5. Video files stored in R2, URLs updated in database

**Credit System:**
- Dynamic pricing based on model + resolution + duration
- Credit costs calculated via `pricing.ts` functions
- All transactions logged in `creditTransactions` table
- Subscription credits granted monthly via Stripe webhooks

**Model Management:**
- Models dynamically configured in `models` table
- Parameter definitions stored in `modelParameters` table
- Frontend forms generated from parameter schemas
- Mapping between frontend params and Replicate API handled by `modelParameterHelpers.ts`

### Frontend Architecture

**Key Components:**
- `VideoGenerationForm` - Main video creation interface with dynamic model parameters
- `VideoLibrary` - User's video gallery with filtering/sorting
- `VideoModal` - Video playback and details view
- `AppHeader` - Navigation with user menu and credit display

**Routing Structure:**
- `/` - Landing page
- `/generate` - Video generation interface
- `/my-videos` - User's video library
- `/pricing` - Credit packages and subscriptions
- `/profile` - User profile and settings

### Convex Best Practices

This project follows the [Convex guidelines](.cursor/rules/convex_rules.mdc):

- **New function syntax**: Always use `query({args, returns, handler})` format
- **Strict typing**: Use proper validators for all function args/returns
- **File-based routing**: Functions in `convex/videos.ts` → `api.videos.functionName`
- **Internal vs Public**: Use `internalMutation` for sensitive operations
- **Indexing**: Database queries use proper indexes (see schema.ts)

### Environment Variables Required

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Backend
NEXT_PUBLIC_CONVEX_URL=https://...

# Payments  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Integration
REPLICATE_API_TOKEN=r8_...
```

## Development Workflows

### Adding New AI Models

1. Insert model record in `models` table via Convex dashboard
2. Add parameter definitions to `modelParameters` table
3. Update `modelParameterHelpers.ts` with parameter mapping logic
4. Add model costs to `modelCosts` table
5. Update pricing calculations in `pricing.ts`

### Database Schema Changes

1. Modify `convex/schema.ts`
2. Deploy to update schema: `npx convex dev`
3. Update TypeScript types are auto-generated in `_generated/`

### Testing Video Generation

1. Ensure Replicate API token is configured
2. Test with shorter durations and smaller models first
3. Monitor webhook endpoint for processing status
4. Check R2 storage for file uploads

## Important Notes

- **Dark Mode Only**: Application is hardcoded to dark theme
- **Credit System**: All video generation consumes credits - monitor balances during testing  
- **Webhook Security**: Stripe webhooks validate signatures - use proper webhook secrets
- **File Storage**: Videos stored in R2 with signed URLs (30-day expiration)
- **Real-time Updates**: UI automatically updates via Convex subscriptions
- **Error Handling**: Failed video generations are marked with error status and messages