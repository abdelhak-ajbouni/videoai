# VideoAI - AI-Powered Video Generation Platform

Transform your ideas into stunning videos using cutting-edge AI technology. No filming, no editing skills required.

## 🚀 Features

### ✅ **Implemented**
- **User Authentication**: Email/password and Google OAuth via Clerk
- **Video Generation**: AI-powered video creation using Google's Veo-3 model
- **Quality Tiers**: Standard (720p), HD (1080p), and 4K based on subscription
- **Duration Options**: 15s, 30s, and 60s video generation
- **Credit System**: Pay-per-use with automatic credit deduction
- **Video Library**: Personal library with search, filter, and sort capabilities
- **Profile Management**: User profile editing and account management
- **Subscription Plans**: Free, Starter, Pro, and Business tiers
- **Billing Dashboard**: Credit purchase and subscription management
- **Real-time Updates**: Live generation progress and status updates
- **Video Download**: Download completed videos in MP4 format
- **Mobile Responsive**: Optimized for all device sizes

### 🔄 **In Progress**
- Stripe payment integration for credit purchases
- Stripe subscription management
- Real-time credit balance updates across tabs
- Enhanced error handling and user feedback

### 📋 **Planned**
- Video sharing with shareable links
- Admin dashboard for platform management
- Usage analytics and insights
- API access for Pro/Business users
- Enhanced prompt optimization
- Team management features

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database and serverless functions)
- **Authentication**: Clerk (OAuth, email/password)
- **AI**: Google Veo-3 via Replicate API
- **Payments**: Stripe (subscriptions and one-time purchases)
- **UI Components**: Radix UI with custom styling
- **File Storage**: Convex file storage for videos

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

Credits are calculated based on video duration and quality:

- **Base cost**: 5 credits per 15 seconds
- **Duration multipliers**: 15s (1x), 30s (2x), 60s (4x)
- **Quality multipliers**: Standard (1x), HD (2x), 4K (4x)

Examples:
- 15s Standard: 5 credits
- 30s HD: 20 credits
- 60s 4K: 80 credits

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
