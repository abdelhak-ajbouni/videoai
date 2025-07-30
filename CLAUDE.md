# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (localhost:3001, automatically runs Convex setup)
- `npm run predev` - Initialize Convex database with seed data
- `npm run build` - Build application for production
- `npm run lint` - Run ESLint checks
- `npm run start` - Start production server

### Mode Management
- `npm run dev-mode` - Switch to development mode
- `npm run prod-mode` - Switch to production mode
- `npm run check-mode` - Check current mode

### Database & Configuration Management
- `npm run init-configs` - Initialize system configurations
- `npm run init-models` - Initialize AI model data
- `npx convex dev --run init` - Initialize database with seed data
- `npx convex dashboard` - Open Convex database dashboard
- `npx convex dev --run migrations` - Run database migrations

## Application Architecture

### Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Convex (real-time database, functions, file storage)
- **Authentication**: Clerk (OAuth + email/password)
- **Payments**: Stripe (checkout, subscriptions, webhooks)
- **AI Models**: Replicate API (Google Veo-3, Luma Ray models)

### Database Schema (Convex)
The application uses Convex as both database and backend. Key tables:
- `users` - User profiles, credits, subscription status
- `videos` - Video metadata, generation status, file storage
- `creditTransactions` - All credit purchases, usage, refunds  
- `subscriptions` - Stripe subscription management
- `models` - Dynamic AI model configurations
- `configurations` - Business rules and feature flags
- `creditPackages` - One-time credit purchase packages
- `subscriptionPlans` - Monthly subscription tiers

### Credit System
- **Base Rate**: 1 credit = $0.02 USD (50 credits per dollar)
- **Pricing Formula**: `(modelCostPerSecond * duration * qualityMultiplier * profitMargin) * 50`
- **Quality Multipliers**: standard (1.0x), high (1.2x), ultra (1.5x)
- **Profit Margin**: 32% markup (1.32 multiplier)

### AI Models
All models are dynamically configured in the database:
- **Google Veo-3**: Premium model, fixed 8s duration, $0.75/second
- **Luma Ray-2-720p**: Budget model, 5s/9s durations, $0.18/second  
- **Luma Ray Flash 2-540p**: Ultra-budget model (default), 5s/9s durations, $0.12/second

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main user dashboard
│   ├── admin/            # Admin interface (models, configurations)
│   ├── generate/         # Video generation page
│   └── library/          # Video library/gallery
├── components/
│   ├── ui/               # Reusable UI components (Radix + custom)
│   ├── layouts/          # Layout components (DashboardLayout)
│   ├── VideoGenerationForm.tsx  # Main video creation form
│   ├── VideoLibrary.tsx         # Video gallery/management
│   └── BillingDashboard.tsx     # Credits/subscription management
convex/
├── schema.ts             # Database schema definitions
├── init.ts              # Database initialization with seed data
├── videos.ts            # Video generation logic & Replicate integration
├── users.ts             # User management & credit system
├── stripe.ts            # Payment processing & webhooks
├── models.ts            # Dynamic AI model management
└── configurations.ts    # Business configuration system
```

### Business Logic
- **Free Tier**: 10 credits (one-time), standard quality only
- **Subscription Tiers**: Starter ($9.99/100 credits), Pro ($29.99/500 credits), Business ($99.99/2000 credits)
- **Credit Packages**: Small (100/$20), Medium (250/$45), Large (500/$80), X-Large (1000/$150)
- **Quality Access**: Free (standard), Starter+ (high), Pro+ (ultra)

### Real-time Features
Convex provides real-time updates for:
- Video generation status and progress
- Credit balance changes
- Subscription status updates
- Live dashboard metrics

### Admin Interface
Located at `/admin/`, provides:
- Dynamic AI model management (`/admin/models`)
- Business configuration management (`/admin/configurations`)
- System monitoring and analytics

### Development Notes
- Database initialization is automatic via `predev` script
- All pricing calculations are centralized in `convex/pricing.ts`
- File uploads handled via Convex storage system
- Real-time video status updates use Convex subscriptions
- Stripe webhooks handled in `convex/stripe.ts`
- Model configurations are stored in database, not hardcoded

### Testing
- Use Stripe test mode for payment testing
- Test video generation with Luma Ray Flash 2-540p (cheapest model)
- Credit calculations can be tested via pricing API functions
- Admin interface requires proper user permissions