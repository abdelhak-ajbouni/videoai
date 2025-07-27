# VideoAI Pricing System Specification

## Overview

VideoAI implements a comprehensive multi-model pricing system with transparent credit-based pricing, supporting premium (Google Veo-3), budget (Luma Ray-2-720p), and ultra-budget (Luma Ray Flash 2-540p) AI models with complete payment processing and subscription management.

## 1. Credit System ✅ COMPLETED

### Credit Value
- **1 Credit = $0.02 USD**
- **1 Dollar = 50 Credits**
- **Profit Margin: 32%** (exactly in the 30-33% target range)

### Credit Packages ✅ IMPLEMENTED
- **Small Pack**: 100 credits ($20) - 2 Google Veo-3 videos or 17 Luma Ray-2 videos
- **Medium Pack**: 250 credits ($45) - 5 Google Veo-3 videos or 42 Luma Ray-2 videos (12.5% savings)
- **Large Pack**: 500 credits ($80) - 12 Google Veo-3 videos or 83 Luma Ray-2 videos (20% savings)
- **X-Large Pack**: 1000 credits ($150) - 25 Google Veo-3 videos or 167 Luma Ray-2 videos (25% savings)

### Subscription Plans ✅ IMPLEMENTED
- **Free Tier**: 10 one-time credits, standard quality only
- **Starter ($9.99/month)**: 100 monthly credits, HD quality
- **Pro ($29.99/month)**: 500 monthly credits, HD + priority processing
- **Business ($99.99/month)**: 2000 monthly credits, 4K + API access

## 2. AI Models & Pricing ✅ COMPLETED

### Google Veo-3 (Premium Model)
- **Replicate Cost**: $0.75 per second
- **Duration**: Fixed 8-second videos only
- **Quality Options**: Standard, High, Ultra
- **Best For**: High-quality, professional videos
- **Target Users**: Professional content creators, businesses

#### Pricing Matrix
| Quality | Duration | Credits | USD Cost |
|---------|----------|---------|----------|
| Standard | 8s | 396 | $7.92 |
| High | 8s | 476 | $9.52 |
| Ultra | 8s | 594 | $11.88 |

### Luma Ray-2-720p (Budget Model)
- **Replicate Cost**: $0.18 per second
- **Duration**: 5-second or 9-second videos only
- **Quality Options**: Standard, High, Ultra
- **Best For**: Cost-effective content creation
- **Target Users**: Content creators, social media managers, budget-conscious users

#### Pricing Matrix
| Quality | Duration | Credits | USD Cost |
|---------|----------|---------|----------|
| Standard | 5s | 60 | $1.20 |
| High | 5s | 72 | $1.44 |
| Ultra | 5s | 90 | $1.80 |
| Standard | 9s | 107 | $2.14 |
| High | 9s | 129 | $2.58 |
| Ultra | 9s | 161 | $3.22 |

### Luma Ray Flash 2-540p (Ultra Budget Model) ✅ NEW
- **Replicate Cost**: $0.12 per second
- **Duration**: 5-second or 9-second videos only
- **Quality Options**: Standard, High, Ultra
- **Best For**: Ultra-fast, ultra-cheap video generation
- **Target Users**: Rapid prototyping, social media content, cost-conscious users
- **Default Model**: Set as default for new users

#### Pricing Matrix
| Quality | Duration | Credits | USD Cost |
|---------|----------|---------|----------|
| Standard | 5s | 40 | $0.80 |
| High | 5s | 48 | $0.96 |
| Ultra | 5s | 60 | $1.20 |
| Standard | 9s | 72 | $1.44 |
| High | 9s | 86 | $1.72 |
| Ultra | 9s | 108 | $2.16 |

## 3. Cost Comparison & Savings ✅ COMPLETED

### Savings with Luma Models
- **Luma Ray-2-720p vs Google Veo-3**: 73-85% savings
- **Luma Ray Flash 2-540p vs Google Veo-3**: 80-90% savings
- **Luma Ray Flash 2-540p vs Luma Ray-2-720p**: 33% additional savings

### Use Case Recommendations
- **Google Veo-3**: Professional presentations, marketing videos, high-quality content
- **Luma Ray-2-720p**: Social media content, rapid prototyping, budget-friendly projects
- **Luma Ray Flash 2-540p**: Ultra-fast prototyping, social media content, maximum cost savings

## 4. Quality Multipliers ✅ COMPLETED

### Quality Tiers
- **Standard**: 1.0x multiplier (base cost)
- **High**: 1.2x multiplier (20% premium)
- **Ultra**: 1.5x multiplier (50% premium)

### Quality Access by Subscription ✅ IMPLEMENTED
- **Free**: Standard quality only
- **Starter**: Standard and High quality
- **Pro**: Standard, High, and Ultra quality
- **Business**: All quality tiers

## 5. Technical Implementation ✅ COMPLETED

### Convex Pricing Functions ✅ IMPLEMENTED
The pricing system is implemented using centralized Convex functions:

```typescript
// Get credit cost for specific combination
const cost = await ctx.runQuery(api.pricing.getCreditCost, {
  modelId: "google/veo-3",
  quality: "standard", 
  duration: 8
});

// Get complete pricing matrix
const matrix = await ctx.runQuery(api.pricing.getPricingMatrix);

// Get model information
const modelInfo = await ctx.runQuery(api.models.getActiveModels);
```

### Frontend Integration ✅ IMPLEMENTED
- Real-time cost calculation using Convex queries
- Dynamic pricing updates based on model/quality/duration selection
- Pricing transparency with complete cost breakdown
- Model comparison and savings display
- Quality tier access control based on subscription

### Database Schema ✅ IMPLEMENTED
```typescript
// Video model field
model: v.string(), // Accept any model ID string

// Duration field (model-specific)
duration: v.string(), // Accept any duration string

// Quality field with subscription-based access
quality: v.union(
  v.literal("standard"),
  v.literal("high"),
  v.literal("ultra")
),
```

## 6. Payment System ✅ COMPLETED

### Stripe Integration ✅ IMPLEMENTED
- **Secure Payment Processing**: PCI-compliant payment handling
- **Credit Package Purchases**: One-time credit purchases with volume discounts
- **Subscription Billing**: Monthly recurring billing for subscription plans
- **Customer Portal**: Self-service billing management
- **Webhook Handling**: Automated credit allocation and subscription management

### Real-time Updates ✅ IMPLEMENTED
- **Live Credit Balance**: Real-time updates across all browser tabs
- **Transaction History**: Complete audit trail with balance tracking
- **Subscription Status**: Live subscription status and billing information
- **Payment Notifications**: Email confirmations and receipts

## 7. Business Benefits ✅ ACHIEVED

### Revenue Optimization ✅ IMPLEMENTED
- **32% profit margin** maintained across all models
- **Flexible pricing** appeals to different user segments
- **Cost transparency** builds user trust
- **Volume discounts** through credit packages
- **Recurring revenue** through subscription plans

### User Experience ✅ IMPLEMENTED
- **Clear model comparison** helps users choose the right option
- **Real-time pricing** eliminates surprises
- **Significant savings** with budget model options
- **Quality flexibility** based on subscription tier
- **Seamless payment experience** with Stripe integration

### Competitive Advantage ✅ ACHIEVED
- **Multi-model approach** unique in the market
- **Transparent pricing** differentiates from competitors
- **Cost-effective options** for budget-conscious users
- **Premium quality** for professional users
- **Complete payment ecosystem** with subscriptions

## 8. Analytics & Monitoring ✅ COMPLETED

### Usage Analytics ✅ IMPLEMENTED
- **Model Usage Tracking**: Which models are most popular
- **Pricing Analytics**: Revenue per model and quality tier
- **User Behavior**: Conversion rates and spending patterns
- **Performance Metrics**: Generation success rates and times

### Business Intelligence ✅ IMPLEMENTED
- **Revenue Tracking**: Monthly recurring revenue and one-time purchases
- **Customer Lifetime Value**: Analysis of user spending patterns
- **Churn Analysis**: Subscription cancellation and renewal rates
- **Cost Optimization**: Monitoring of AI model costs and margins

## 9. Future Considerations

### Potential Enhancements 🔄 PLANNED
- **API Access Pricing**: Developer API for integrations
- **Team Management**: Multi-user collaboration and billing
- **Enterprise Pricing**: Custom pricing for large organizations
- **Seasonal Promotions**: Limited-time pricing offers
- **Additional AI Models**: Integration of new models as they become available

### Advanced Features 🔄 PLANNED
- **Dynamic Pricing**: Pricing adjustments based on demand
- **A/B Testing**: Pricing strategy optimization
- **Predictive Analytics**: Usage forecasting and capacity planning
- **International Pricing**: Multi-currency support

## 10. Implementation Status ✅ COMPLETED

### ✅ Completed Features
- **Convex pricing functions** with centralized logic ✅
- **Frontend integration** with real-time updates ✅
- **Database schema** with model constraints ✅
- **Migration scripts** for existing data ✅
- **Type safety** with full TypeScript support ✅
- **Pricing transparency** in UI ✅
- **Model comparison** and savings display ✅
- **Stripe integration** for credit purchases ✅
- **Subscription management** for billing ✅
- **Real-time credit updates** across tabs ✅
- **Customer portal** for billing management ✅
- **Webhook handling** for automated processes ✅
- **Analytics dashboard** for business insights ✅
- **Admin interface** for configuration management ✅

### 🎯 **Success Metrics Achieved**
- **Revenue Generation**: Complete payment processing system operational
- **User Conversion**: Subscription plans and credit packages available
- **Cost Transparency**: Real-time pricing with complete breakdown
- **Profit Margin**: 32% maintained across all models and tiers
- **User Experience**: Seamless payment flow with Stripe integration

**🚀 The VideoAI pricing system is now a complete, revenue-generating business model!** 