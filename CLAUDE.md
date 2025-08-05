# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (localhost:3000, automatically runs Convex setup)
- `npm run predev` - Initialize Convex database with seed data
- `npm run build` - Build application for production
- `npm run lint` - Run ESLint checks
- `npm run start` - Start production server

### Mode Management
- `npm run dev-mode` - Switch to development mode
- `npm run prod-mode` - Switch to production mode
- `npm run check-mode` - Check current mode

### Database & Configuration Management
- `npm run db:clear` - Clear all database data
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Clear and reseed database

### Testing Commands
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Convex Commands
- `npx convex dev --run init` - Initialize database with seed data
- `npx convex dashboard` - Open Convex database dashboard
- `npx convex logs` - View Convex function logs
- `npx convex env set <KEY> <VALUE>` - Set environment variable
- `npx convex env list` - List all environment variables

## Application Architecture

### Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Convex (real-time database, functions, file storage)
- **Authentication**: Clerk (OAuth + email/password)
- **Payments**: Stripe (checkout, subscriptions, webhooks)
- **AI Models**: Replicate API (Google Veo-3, Luma Ray models)

### Database Schema (Convex)
The application uses Convex as both database and backend. Key tables:
- `userProfiles` - User profiles, credits, subscription status (linked via Clerk ID)
- `videos` - Video metadata, generation status, file storage, analytics
- `creditTransactions` - All credit purchases, usage, refunds with balance tracking
- `subscriptions` - Stripe subscription management with billing cycles
- `models` - Dynamic AI model configurations with pricing and capabilities
- `configurations` - Business rules and feature flags with type validation
- `creditPackages` - One-time credit purchase packages with popularity flags
- `subscriptionPlans` - Monthly subscription tiers with feature lists
- `modelParameters` - Dynamic parameter configuration for each AI model
- `videoParameters` - Actual parameters used for each video generation

### Credit System
- **Base Rate**: 1 credit = $0.02 USD (50 credits per dollar)
- **Pricing Formula**: `(modelCostPerSecond * duration * qualityMultiplier * profitMargin) * 50`
- **Dynamic Configuration**: All rates, multipliers, and limits stored in `configurations` table
- **Quality Multipliers**: Configurable per quality level (standard/high/ultra)
- **Free Tier**: New user credits configurable via `free_tier_credits` configuration

### AI Models
All models are dynamically configured in the `models` database table with:
- Model identification, names, and descriptions
- Replicate integration endpoints and versions
- Per-second pricing and model types for categorization
- Active status and premium/default flags
- Dynamic parameter configurations stored in `modelParameters` table

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/webhooks/      # API webhooks (Replicate callbacks)
│   ├── generate/          # Video generation page
│   ├── my-videos/         # Video library/gallery
│   ├── pricing/           # Pricing and subscription page
│   ├── profile/           # User profile management
│   └── [legal]/           # Privacy policy, terms, refund policy
├── components/
│   ├── ui/                # Reusable UI components (Radix + custom)
│   ├── layouts/           # Layout components (app-layout)
│   ├── navigation/        # Header, sidebar, mobile navigation
│   ├── VideoGenerationForm.tsx  # Main video creation form
│   ├── VideoLibrary.tsx         # Video gallery/management
│   └── VideoModal.tsx           # Video playback modal
convex/
├── schema.ts              # Database schema definitions
├── seed.ts                # Database initialization with seed data
├── videos.ts              # Video generation logic & Replicate integration
├── users.ts & userProfiles.ts  # User management & credit system
├── stripe.ts              # Payment processing & webhooks
├── models.ts              # Dynamic AI model management
├── configurations.ts      # Business configuration system
├── pricing.ts             # Centralized pricing calculations
└── lib/                   # Utilities (validation, Replicate client)
```

### Business Logic
All pricing and business rules are stored in database tables:
- **Free Tier**: Credits defined in `configurations` table (currently 10 credits one-time)
- **Subscription Tiers**: Dynamic plans in `subscriptionPlans` table with monthly credits and feature lists
- **Credit Packages**: One-time purchases in `creditPackages` table with various credit amounts
- **Quality Access**: Tier-based access to quality settings (standard/high/ultra)
- **Profit Margins**: Configurable markup percentage in `configurations` table

### Real-time Features
Convex provides real-time updates for:
- Video generation status and progress
- Credit balance changes
- Subscription status updates
- Live dashboard metrics

### Video Generation Workflow
1. **Parameter Validation**: Frontend form validates using dynamic model parameters from `modelParameters` table
2. **Credit Calculation**: Real-time pricing calculation using `convex/pricing.ts` based on model, quality, duration
3. **Credit Deduction**: Upfront credit deduction with transaction logging in `creditTransactions`
4. **Replicate Integration**: Parameters mapped and sent to appropriate Replicate model via `convex/videos.ts`
5. **Status Tracking**: Real-time status updates (pending → processing → completed/failed)
6. **File Management**: Videos stored externally with R2 CDN fallback for secure access
7. **Analytics**: View/download tracking with comprehensive metadata storage

### Admin Interface
Located at `/admin/`, provides:
- Dynamic AI model management (`/admin/models`)
- Business configuration management (`/admin/configurations`)
- System monitoring and analytics

### Development Notes
- Database initialization is automatic via `predev` script (runs `convex dev --until-success`)
- Development server runs on port 3000
- All pricing calculations are centralized in `convex/pricing.ts`
- File uploads handled via Convex storage system
- Real-time video status updates use Convex subscriptions
- Stripe webhooks handled in `convex/stripe.ts` with proper verification
- Model configurations are stored in database, not hardcoded
- Uses Jest for testing with watch mode and coverage reporting
- Mode switching available for dev/prod environments via scripts
- Dark theme only (no light theme support)

### Key Development Patterns
- **Authentication**: All user data linked via Clerk ID, not internal user IDs
- **Real-time Updates**: Convex subscriptions provide live status updates across all components
- **Parameter Management**: Dynamic model parameters stored in `modelParameters` table
- **File Storage**: Videos stored in R2 CDN
- **Error Handling**: Comprehensive error states in video generation pipeline with validation utilities
- **Analytics**: Built-in view tracking, download counts, and engagement metrics
- **Configuration-Driven**: Business rules, pricing, and model parameters stored in database tables
- **Type Safety**: Comprehensive Zod validation schemas for all user inputs and API calls

### Environment Configuration
Required environment variables for development:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication (public key)
- `CLERK_SECRET_KEY` - Clerk authentication (secret key)
- `NEXT_PUBLIC_CONVEX_URL` - Convex database URL
- `STRIPE_SECRET_KEY` - Stripe payments (secret key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe payments (public key)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `REPLICATE_API_TOKEN` - Replicate AI model access

### Database Inspection
Query current configuration and pricing data:
```bash
# View all active models
npx convex run models:getActiveModels

# View current business configurations
npx convex run configurations:getByCategory '{"category": "pricing"}'

# View subscription plans
npx convex run subscriptionPlans:getActivePlans

# View credit packages
npx convex run creditPackages:getActivePackages
```

### Testing & Debugging
- Use Stripe test mode for payment testing
- Credit calculations can be tested via pricing API functions
- Database can be cleared and reseeded for testing
- Mode toggle script helps switch between dev/prod configurations
- Use `npx convex logs` to debug Convex function execution
- R2 CDN URLs are dynamically generated with 30-day expiration
- All business logic is database-driven - no hardcoded values in code