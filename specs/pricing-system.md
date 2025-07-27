# VideoAI Pricing System Specification

## Overview

VideoAI implements a comprehensive dual-model pricing system with transparent credit-based pricing, supporting both premium (Google Veo-3) and budget (Luma Ray-2-720p) AI models.

## 1. Credit System

### Credit Value
- **1 Credit = $0.02 USD**
- **1 Dollar = 50 Credits**
- **Profit Margin: 32%** (exactly in the 30-33% target range)

### Credit Packages (Recommended)
- **Starter**: 2,000 credits ($40) - 5 Google Veo-3 videos or 33 Luma Ray-2 videos
- **Basic**: 5,000 credits ($100) - 12 Google Veo-3 videos or 83 Luma Ray-2 videos
- **Pro**: 15,000 credits ($300) - 37 Google Veo-3 videos or 250 Luma Ray-2 videos
- **Business**: 50,000 credits ($1,000) - 126 Google Veo-3 videos or 833 Luma Ray-2 videos

## 2. AI Models & Pricing

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

## 3. Cost Comparison & Savings

### Savings with Luma Ray-2
- **5s vs Google Veo-3 8s**: 85% savings
- **9s vs Google Veo-3 8s**: 73% savings
- **Average savings**: 79% across all combinations

### Use Case Recommendations
- **Google Veo-3**: Professional presentations, marketing videos, high-quality content
- **Luma Ray-2**: Social media content, rapid prototyping, budget-friendly projects

## 4. Quality Multipliers

### Quality Tiers
- **Standard**: 1.0x multiplier (base cost)
- **High**: 1.2x multiplier (20% premium)
- **Ultra**: 1.5x multiplier (50% premium)

### Quality Access by Subscription
- **Free**: Standard quality only
- **Starter**: Standard and High quality
- **Pro**: Standard, High, and Ultra quality
- **Business**: All quality tiers

## 5. Technical Implementation

### Convex Pricing Functions
The pricing system is implemented using centralized Convex functions:

```typescript
// Get credit cost for specific combination
const cost = await ctx.runQuery(api.pricing.getCreditCost, {
  model: "google/veo-3",
  quality: "standard", 
  duration: "8"
});

// Get complete pricing matrix
const matrix = await ctx.runQuery(api.pricing.getPricingMatrix);

// Get model information
const modelInfo = await ctx.runQuery(api.pricing.getModelInfo);
```

### Frontend Integration
- Real-time cost calculation using Convex queries
- Dynamic pricing updates based on model/quality/duration selection
- Pricing transparency with complete cost breakdown
- Model comparison and savings display

### Database Schema
```typescript
// Video model field
model: v.optional(v.union(
  v.literal("google/veo-3"),
  v.literal("luma/ray-2-720p")
)),

// Duration field (model-specific)
duration: v.union(v.literal("5"), v.literal("8"), v.literal("9")),
```

## 6. Business Benefits

### Revenue Optimization
- **32% profit margin** maintained across all models
- **Flexible pricing** appeals to different user segments
- **Cost transparency** builds user trust
- **Volume discounts** through credit packages

### User Experience
- **Clear model comparison** helps users choose the right option
- **Real-time pricing** eliminates surprises
- **Significant savings** with budget model option
- **Quality flexibility** based on subscription tier

### Competitive Advantage
- **Dual-model approach** unique in the market
- **Transparent pricing** differentiates from competitors
- **Cost-effective options** for budget-conscious users
- **Premium quality** for professional users

## 7. Future Considerations

### Potential Enhancements
- **Volume discounts** for high-usage users
- **Seasonal pricing** promotions
- **Enterprise pricing** for large organizations
- **API access pricing** for developers
- **Additional AI models** as they become available

### Monitoring & Optimization
- **Usage analytics** to understand model preferences
- **Pricing optimization** based on user behavior
- **Cost monitoring** to maintain profit margins
- **User feedback** for pricing adjustments

## 8. Implementation Status

### ✅ Completed
- **Convex pricing functions** with centralized logic
- **Frontend integration** with real-time updates
- **Database schema** with model constraints
- **Migration scripts** for existing data
- **Type safety** with full TypeScript support
- **Pricing transparency** in UI
- **Model comparison** and savings display

### 🚧 In Progress
- **Stripe integration** for credit purchases
- **Subscription management** for billing
- **Real-time credit updates** across tabs

### 📋 Planned
- **Advanced analytics** for pricing optimization
- **A/B testing** for pricing strategies
- **Dynamic pricing** based on demand 