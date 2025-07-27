# VideoAI - Complete AI Video Generation Platform

## 🎉 **Production-Ready SaaS Platform**

VideoAI is a complete, revenue-generating SaaS platform that enables users to generate high-quality videos directly from text prompts using multiple AI models. The platform features a comprehensive credit-based pricing system, subscription management, and real-time video processing.

**🔗 Live Demo:** http://localhost:3001/dashboard

## ✨ **Key Features**

### 🚀 **AI Video Generation**
- **Multiple AI Models**: Google Veo-3 (Premium), Luma Ray-2-720p (Budget), Luma Ray Flash 2-540p (Ultra Budget)
- **Real-time Processing**: Live status updates and progress tracking
- **Quality Options**: Standard, High, and Ultra quality tiers
- **Smart Defaults**: Luma Ray Flash 2-540p as default for cost-effective generation

### 💳 **Complete Payment System**
- **Stripe Integration**: Secure payment processing with webhooks
- **Credit Packages**: 4 tiers with volume discounts (12.5-25% savings)
- **Subscription Plans**: 3 monthly tiers (Starter, Pro, Business)
- **Customer Portal**: Self-service billing management
- **Real-time Billing**: Live credit balance and transaction history

### 📊 **Advanced Analytics**
- **Usage Dashboard**: Personal usage insights and statistics
- **Revenue Tracking**: Subscription and credit purchase analytics
- **Model Performance**: Success rates and generation times
- **User Engagement**: Session duration and feature usage

### ⚙️ **Admin Interface**
- **Model Management**: Dynamic AI model configuration
- **Configuration System**: Business rules and feature flags
- **System Monitoring**: Health checks and performance metrics
- **User Management**: Account administration and support

### 🎨 **Professional UI**
- **Responsive Design**: Beautiful interface on all devices
- **Real-time Updates**: Live status across all browser tabs
- **Modern Components**: Tailwind CSS + Radix UI components
- **Accessibility**: WCAG 2.1 compliant design

## 🏗️ **Architecture**

### **Technology Stack**
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Convex (Real-time database, functions, file storage)
- **Authentication**: Clerk (OAuth, email/password)
- **Payments**: Stripe (checkout, subscriptions, webhooks)
- **AI Models**: Replicate (Google Veo-3, Luma Ray models)
- **Deployment**: Vercel (frontend), Convex Cloud (backend)

### **Database Schema**
```typescript
// Core entities
users: User profiles, credits, subscriptions
videos: Video metadata, generation status, file storage
creditTransactions: Credit purchases, usage, refunds
subscriptions: Stripe subscriptions, billing cycles
creditPackages: One-time credit purchase options
subscriptionPlans: Monthly subscription tiers
models: AI model configurations and pricing
configurations: Business rules and feature flags
```

## 💰 **Pricing Structure**

### **Credit System**
- **1 Credit = $0.02 USD** (50 credits per dollar)
- **32% Profit Margin** maintained across all models
- **Real-time Pricing** with complete cost breakdown

### **AI Model Pricing**
| Model | Type | Cost/Second | Duration | Credits (8s) |
|-------|------|-------------|----------|--------------|
| **Google Veo-3** | Premium | $0.75 | Fixed 8s | 396-594 |
| **Luma Ray-2-720p** | Budget | $0.18 | 5s/9s | 60-161 |
| **Luma Ray Flash 2-540p** | Ultra Budget | $0.12 | 5s/9s | 40-108 |

### **Credit Packages**
| Package | Credits | Price | Savings |
|---------|---------|-------|---------|
| Small Pack | 100 | $20 | 0% |
| Medium Pack | 250 | $45 | 12.5% |
| Large Pack | 500 | $80 | 20% |
| X-Large Pack | 1000 | $150 | 25% |

### **Subscription Plans**
| Plan | Monthly Credits | Price | Features |
|------|-----------------|-------|----------|
| Free | 10 (one-time) | $0 | Standard quality |
| Starter | 100 | $9.99 | HD quality |
| Pro | 500 | $29.99 | HD + Ultra + Priority |
| Business | 2000 | $99.99 | 4K + API access |

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Convex account
- Clerk account
- Stripe account
- Replicate account

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd videoai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Configure the following variables:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://...

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Replicate AI
REPLICATE_API_TOKEN=r8_...
```

4. **Initialize the database**
```bash
npm run predev
```

5. **Start the development server**
```bash
npm run dev
```

6. **Access the application**
Open [http://localhost:3001](http://localhost:3001)

## 📁 **Project Structure**

```
videoai/
├── convex/                 # Backend functions and schema
│   ├── schema.ts          # Database schema
│   ├── init.ts            # Database initialization
│   ├── videos.ts          # Video generation logic
│   ├── users.ts           # User management
│   ├── credits.ts         # Credit system
│   ├── stripe.ts          # Payment processing
│   ├── models.ts          # AI model management
│   └── configurations.ts  # Business configuration
├── src/
│   ├── app/               # Next.js app router
│   │   ├── dashboard/     # Main dashboard
│   │   ├── admin/         # Admin interface
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── VideoGenerationForm.tsx
│   │   ├── VideoLibrary.tsx
│   │   ├── BillingDashboard.tsx
│   │   └── ...
│   └── lib/               # Utility functions
├── specs/                 # Documentation
│   ├── requirements.md    # Requirements specification
│   ├── tasks.md          # Implementation plan
│   ├── pricing-system.md # Pricing specification
│   └── design.md         # Technical design
└── public/               # Static assets
```

## 🔧 **Development**

### **Available Scripts**
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run predev           # Initialize database
npm run dev-mode         # Switch to development mode
npm run prod-mode        # Switch to production mode
```

### **Database Management**
```bash
# Initialize database with seed data
npm run predev

# Run database migrations
npx convex dev --run migrations

# View database in Convex dashboard
npx convex dashboard
```

### **Payment Testing**
- Use Stripe test keys for development
- Test credit purchases and subscriptions
- Verify webhook handling
- Test customer portal functionality

## 📊 **Analytics & Monitoring**

### **Business Metrics**
- **Revenue Tracking**: Monthly recurring revenue and one-time purchases
- **User Analytics**: Registration, conversion, and retention rates
- **Model Performance**: Success rates and generation times
- **Cost Optimization**: AI model costs and profit margins

### **Technical Monitoring**
- **Convex Dashboard**: Real-time function performance
- **Error Tracking**: Automatic error reporting and alerts
- **Performance Metrics**: Response times and throughput
- **System Health**: Database and API monitoring

## 🔒 **Security & Compliance**

### **Data Protection**
- **GDPR Compliance**: User data protection and privacy
- **Encrypted Storage**: All data encrypted at rest and in transit
- **Secure Authentication**: OAuth and password-based auth
- **Payment Security**: PCI-compliant payment processing

### **Access Control**
- **Role-based Access**: User and admin permissions
- **API Security**: Rate limiting and authentication
- **File Access**: Secure video storage and delivery
- **Audit Logging**: Complete transaction history

## 🚀 **Deployment**

### **Production Setup**
1. **Deploy to Vercel**
```bash
npm run build
vercel --prod
```

2. **Configure Convex Production**
```bash
npx convex deploy --prod
```

3. **Set up Stripe Production**
- Configure production webhooks
- Update environment variables
- Test payment flows

4. **Monitor and Scale**
- Set up monitoring and alerts
- Configure auto-scaling
- Monitor performance metrics

## 📈 **Business Model**

### **Revenue Streams**
- **Credit Purchases**: One-time credit packages
- **Subscriptions**: Monthly recurring revenue
- **Volume Discounts**: Incentivize larger purchases
- **Premium Features**: Advanced quality tiers

### **Cost Structure**
- **AI Model Costs**: Replicate API usage
- **Infrastructure**: Convex and Vercel hosting
- **Payment Processing**: Stripe transaction fees
- **Support**: Customer service and maintenance

### **Profit Margins**
- **32% Target Margin**: Maintained across all models
- **Volume Optimization**: Bulk discounts for efficiency
- **Cost Transparency**: Clear pricing for users
- **Scalable Model**: Automated processing and billing

## 🤝 **Contributing**

### **Development Guidelines**
- Follow TypeScript best practices
- Use conventional commit messages
- Write comprehensive tests
- Update documentation
- Follow security best practices

### **Code Quality**
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Component testing
- Integration testing

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Documentation**
- [Requirements Specification](specs/requirements.md)
- [Implementation Plan](specs/tasks.md)
- [Pricing System](specs/pricing-system.md)
- [Technical Design](specs/design.md)

### **Getting Help**
- Check the documentation
- Review the codebase
- Test the application
- Contact the development team

---

**🎉 VideoAI is a complete, production-ready SaaS platform ready to generate revenue!**
