# VideoAI - AI-Powered Video Generation Platform

Transform your ideas into stunning videos using cutting-edge AI technology. No filming, no editing skills required.

## ✨ Features

### ✅ Implemented
- **User Authentication**: Secure login with Clerk
- **Video Generation**: AI-powered video creation with multiple models
- **Credit System**: Flexible credit-based pricing
- **Subscription Plans**: Multiple tiers (Free, Starter, Pro, Business)
- **Video Library**: Organize and manage generated videos
- **Billing Integration**: Stripe-powered payments and subscriptions
- **Configuration Management**: Database-driven system settings
- **Admin Dashboard**: Configuration and model management
- **Model Management**: Dynamic AI model administration

### 🚧 In Progress
- **Video Analytics**: Usage statistics and insights
- **API Access**: RESTful API for integrations
- **Advanced Video Editing**: Post-generation enhancements
- **Collaboration Features**: Team workspaces and sharing

### 📋 Planned
- **Real-time Processing**: Live video generation status
- **Advanced AI Models**: More video generation options
- **Video Templates**: Pre-built video styles
- **Export Options**: Multiple format support
- **Mobile App**: Native iOS/Android applications

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React**: UI library with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Beautiful icon library

### Backend
- **Convex**: Real-time database and serverless functions
- **Clerk**: Authentication and user management
- **Stripe**: Payment processing and subscriptions
- **Replicate**: AI model hosting and inference

### Infrastructure
- **Vercel**: Hosting and deployment
- **Convex Cloud**: Database and backend hosting
- **Stripe Dashboard**: Payment management
- **Clerk Dashboard**: User management

### AI & Video
- **Google Veo-3**: High-quality video generation
- **Luma Ray Models**: Fast, cost-effective generation
- **Replicate API**: Model inference and hosting

### Development
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Git**: Version control
- **npm**: Package management

## 💰 Pricing System

### Credit-Based Pricing
- **1 Credit = $0.02** (50 credits per dollar)
- **Dynamic Pricing**: Based on model, quality, and duration
- **Quality Multipliers**: Standard (1.0x), High (1.2x), Ultra (1.5x)
- **Model Costs**: Varies by AI model and provider

### Subscription Plans
- **Free**: 10 credits, Standard quality only
- **Starter ($9/month)**: 500 credits, High quality access
- **Pro ($29/month)**: 2000 credits, Ultra quality access
- **Business ($99/month)**: 10000 credits, API access, priority processing

## 🎛️ Configuration Management

### Access
- **Admin Route**: `/admin/configurations`
- **Authentication**: Required
- **Authorization**: Admin users only

### Categories
- **Business**: Profit margins, credit conversion rates
- **Pricing**: Quality multipliers, model costs
- **Models**: AI model configurations and capabilities
- **Features**: Feature flags and system settings
- **Limits**: System limits and constraints
- **Subscriptions**: Quality access by subscription tier

### API Usage
```typescript
// Get configuration value
const profitMargin = useQuery(api.configurations.getConfig, { 
  key: "profit_margin" 
});

// Update configuration
const updateConfig = useMutation(api.configurations.updateConfig);
await updateConfig({ key: "profit_margin", value: 1.35 });
```

### Initialization
```bash
npm run init-configs
```

## 🤖 Model Management

### Access
- **Admin Route**: `/admin/models`
- **Authentication**: Required
- **Authorization**: Admin users only

### Features
- **Dynamic Model Management**: Add, update, and remove models
- **Model Validation**: Automatic capability validation
- **Usage Tracking**: Performance and success rate monitoring
- **Category Organization**: Premium, Budget, Experimental models
- **Default Model Management**: Automatic default model handling

### Default Models
- **Google Veo-3**: Premium high-quality generation ($0.75/s)
- **Luma Ray-2-720p**: Budget cost-effective generation ($0.18/s)
- **Luma Ray Flash 2-540p**: Ultra-fast prototyping ($0.12/s)

### API Usage
```typescript
// Get available models
const activeModels = useQuery(api.models.getActiveModels);
const defaultModel = useQuery(api.models.getDefaultModel);

// Get model pricing
const creditCost = useQuery(api.pricing.getCreditCost, {
  modelId: "google/veo-3",
  quality: "high",
  duration: 8
});
```

### Initialization
```bash
npm run init-models
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
