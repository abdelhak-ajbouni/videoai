# VideoAI - AI-Powered Video Generation Platform

Transform your ideas into stunning videos using cutting-edge AI technology. No filming, no editing skills required.

## 🚀 Features

### ✅ **Implemented**
- **User Authentication**: Email/password and Google OAuth via Clerk
- **Dual AI Models**: Google Veo-3 (Premium) and Luma Ray-2-720p (Budget)
- **Model-Specific Durations**: 
  - Google Veo-3: Fixed 8-second duration
  - Luma Ray-2-720p: 5-second or 9-second options
- **Quality Tiers**: Standard, High, and Ultra based on subscription
- **Credit System**: Pay-per-use with $0.02 per credit (1 dollar = 50 credits)
- **Pricing Transparency**: Real-time cost calculation with 32% profit margin
- **Video Library**: Personal library with search, filter, and sort capabilities
- **Profile Management**: User profile editing and account management
- **Subscription Plans**: Free, Starter, Pro, and Business tiers
- **Billing Dashboard**: Credit purchase and subscription management
- **Real-time Updates**: Live generation progress and status updates
- **Video Download**: Download completed videos in MP4 format
- **Mobile Responsive**: Optimized for all device sizes
- **Configuration Management**: Database-driven system settings with admin interface
- **Admin Dashboard**: Visual configuration management at `/admin/configurations`

### 🔄 **In Progress**
- Stripe payment integration for credit purchases
- Stripe subscription management
- Real-time credit balance updates across tabs
- Enhanced error handling and user feedback

### 📋 **Planned**
- Video sharing with shareable links
- Usage analytics and insights
- API access for Pro/Business users
- Enhanced prompt optimization
- Team management features

## 💰 Pricing System

### Credit Value
- **1 Credit = $0.02** (1 dollar = 50 credits)
- **32% profit margin** maintained across all models
- **Configurable**: All pricing can be adjusted via admin interface

### AI Models & Pricing

#### Google Veo-3 (Premium)
- **Duration**: Fixed 8-second videos only
- **Quality**: Standard, High, Ultra
- **Pricing**: 396-594 credits ($7.92-$11.88)
- **Best For**: High-quality, professional videos

#### Luma Ray-2-720p (Budget)
- **Duration**: 5-second or 9-second videos
- **Quality**: Standard, High, Ultra
- **Pricing**: 60-161 credits ($1.20-$3.22)
- **Best For**: Cost-effective content creation
- **Savings**: 73-85% cheaper than Google Veo-3

### Example Costs
| Model | Duration | Quality | Credits | USD Cost |
|-------|----------|---------|---------|----------|
| Google Veo-3 | 8s | Standard | 396 | $7.92 |
| Google Veo-3 | 8s | High | 476 | $9.52 |
| Google Veo-3 | 8s | Ultra | 594 | $11.88 |
| Luma Ray-2 | 5s | Standard | 60 | $1.20 |
| Luma Ray-2 | 9s | Standard | 107 | $2.14 |

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database and serverless functions)
- **Authentication**: Clerk (OAuth, email/password)
- **AI**: Google Veo-3 and Luma Ray-2-720p via Replicate API
- **Payments**: Stripe (subscriptions and one-time purchases)
- **UI Components**: Radix UI with custom styling
- **File Storage**: Convex file storage for videos
- **Pricing**: Database-driven configuration system
- **Admin Interface**: Visual configuration management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Convex account ([convex.dev](https://convex.dev))
- Clerk account ([clerk.com](https://clerk.com))
- Replicate account ([replicate.com](https://replicate.com))
- Stripe account ([stripe.com](https://stripe.com)) - for payments

### 1. Clone and Install

```bash
git clone <repository-url>
cd videoai
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```bash
# Convex - Get from dashboard after creating project
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk - Get from your Clerk dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=your-domain.clerk.accounts.dev

# Replicate - Get from account settings
REPLICATE_API_TOKEN=r8_...

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONVEX_SITE_URL=http://localhost:3000
```

### 3. Database Setup

Initialize Convex:

```bash
npx convex dev
```

This will:
- Set up your database schema
- Deploy backend functions
- Start the development server

### 4. Authentication Setup

In your Clerk dashboard:
1. Add `http://localhost:3000` to allowed origins
2. Configure OAuth providers (Google recommended)
3. Set up webhook endpoint: `http://localhost:3000/api/webhooks/clerk`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

### 5. AI Model Setup

In your Replicate dashboard:
1. Generate API token
2. Set up webhook endpoint: `http://localhost:3000/api/webhooks/replicate`

### 6. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📁 Project Structure

```
videoai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── billing/        # Subscription & billing
│   │   │   └── profile/        # User profile
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── providers.tsx       # Context providers
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── VideoGenerationForm.tsx
│   │   └── VideoLibrary.tsx
│   └── lib/
│       └── utils.ts            # Utility functions
├── convex/
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User functions
│   ├── videos.ts               # Video functions
│   ├── http.ts                 # HTTP endpoints/webhooks
│   └── auth.config.ts          # Auth configuration
├── specs/                      # Project documentation
└── public/                     # Static assets
```

## 🔧 Configuration

### Subscription Plans

The application supports 4 subscription tiers:

1. **Free** - 10 one-time credits, standard quality only
2. **Starter ($9.99/month)** - 100 monthly credits, HD quality
3. **Pro ($29.99/month)** - 500 monthly credits, HD + priority processing
4. **Business ($99.99/month)** - 2000 monthly credits, 4K + API access

### Credit Costs

Credits are calculated based on video duration, quality, and AI model:

- **Credit Value**: $0.02 per credit (1 dollar = 50 credits)
- **Profit Margin**: 32%

#### Model Options

**Google Veo-3 (Premium)**
- Cost: $0.75/second from Replicate
- Best for: High-quality, professional videos
- Pricing: ~50 credits/second

**Luma Ray-2-720p (Budget)**
- Cost: $0.18/second from Replicate  
- Best for: Cost-effective, quick generation
- Pricing: ~12 credits/second

#### Quality Multipliers
- **Standard**: 1.0x (base cost)
- **High**: 1.2x (20% premium)
- **Ultra**: 1.5x (50% premium)

#### Duration Multipliers
- **15s**: 1x (base cost)
- **30s**: 2x (double cost)
- **60s**: 4x (quadruple cost)

#### Example Costs

| Model | Duration | Quality | Credits | USD Equivalent |
|-------|----------|---------|---------|----------------|
| Google Veo-3 | 15s | Standard | 750 | $15.00 |
| Google Veo-3 | 30s | Standard | 1,500 | $30.00 |
| Google Veo-3 | 60s | Standard | 3,000 | $60.00 |
| Luma Ray-2 | 15s | Standard | 180 | $3.60 |
| Luma Ray-2 | 30s | Standard | 360 | $7.20 |
| Luma Ray-2 | 60s | Standard | 720 | $14.40 |

**Credit Package Recommendations:**
- Starter: 2,000 credits ($40) - 2-3 Luma videos or 1 Google Veo-3 video
- Basic: 5,000 credits ($100) - 5-10 Luma videos or 2-3 Google Veo-3 videos
- Pro: 15,000 credits ($300) - 15-30 Luma videos or 5-10 Google Veo-3 videos
- Business: 50,000+ credits with volume discounts

## 📚 API Documentation

### Video Generation

```typescript
// Create a new video
const video = await createVideo({
  title: "My Amazing Video",
  prompt: "A sunset over the ocean with waves",
  quality: "high",    // standard | high | ultra
  duration: "30"      // 15 | 30 | 60
});
```

### User Management

```typescript
// Get current user
const user = await getCurrentUser();

// Update user profile
await updateUser({
  clerkId: "user_123",
  name: "John Doe",
  email: "john@example.com"
});
```

## ⚙️ Configuration Management

VideoAI features a comprehensive configuration management system that allows administrators to modify system settings without code deployments.

### Accessing the Admin Interface

Navigate to `/admin/configurations` to access the visual configuration management interface.

### Key Configuration Categories

1. **Business Settings**
   - Profit margins and credit conversion rates
   - Free tier credit allocation
   - Revenue optimization parameters

2. **Pricing & Costs**
   - Quality multipliers (Standard, High, Ultra)
   - Model-specific pricing
   - Cost calculation parameters

3. **AI Models**
   - Model configurations and capabilities
   - Supported durations and quality options
   - Model availability and defaults

4. **Feature Flags**
   - System feature toggles
   - Experimental feature controls
   - A/B testing capabilities

5. **System Limits**
   - Rate limits and usage constraints
   - File size and duration limits
   - Concurrent generation limits

6. **Subscription Settings**
   - Quality access by subscription tier
   - Feature access control
   - Subscription-specific limits

### Configuration API

```typescript
// Get specific configuration
const profitMargin = useQuery(api.configurations.getConfig, { 
  key: "profit_margin" 
});

// Get all business configurations
const businessConfigs = useQuery(api.configurations.getConfigsByCategory, { 
  category: "business" 
});

// Update configuration
const updateConfig = useMutation(api.configurations.updateConfig);
await updateConfig({
  key: "profit_margin",
  value: 1.35, // New 35% markup
});
```

### Initialization

```bash
# Initialize default configurations
npm run init-configs
```

For detailed configuration management documentation, see [docs/configuration-system.md](docs/configuration-system.md).

## 🔒 Security

- All user data is encrypted in transit and at rest
- Clerk handles authentication with industry-standard security
- Webhook endpoints are secured with secret validation
- Credit transactions are atomic and logged
- User permissions are enforced at the database level

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `specs/` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core video generation features
- User authentication and profile management
- Credit system and subscription plans
- Video library with search and filtering
- Mobile-responsive design

---

Built with ❤️ using Next.js, Convex, and cutting-edge AI technology.
