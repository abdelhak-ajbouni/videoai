# Veymo.ai - AI Video Generation Platform

A SaaS platform for generating videos from text prompts using multiple AI models with a credit-based pricing system and subscription management.

## Getting Started

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd veymo.ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
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

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run predev           # Initialize database with seed data
npm run db:clear         # Clear all database data
npm run db:seed          # Seed database with initial data
npm run db:reset         # Clear and reseed database
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage report
npx convex dashboard     # Open Convex database dashboard
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.