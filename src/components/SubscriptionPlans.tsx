"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, CreditCard, Check, Zap, Star, Crown, Settings } from "lucide-react";

// Icon mapping for subscription plans
const PLAN_ICONS = {
  starter: Zap,
  pro: Star,
  business: Crown,
} as const;

export function SubscriptionPlans() {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user data and subscription plans
  const userData = useQuery(api.users.getCurrentUser);
  const subscriptionPlans = useQuery(api.subscriptionPlans.getActivePlans);
  const createSubscriptionSession = useAction(api.stripe.createSubscriptionCheckoutSession);
  const createPortalSession = useAction(api.stripe.createCustomerPortalSession);

  const handleSubscribe = async (planId: string) => {
    if (!userData) return;

    setIsLoading(true);
    try {
      const checkoutUrl = await createSubscriptionSession({
        userId: userData._id,
        planId: planId as any,
      });

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating subscription session:", error);
      alert("Failed to create subscription session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!userData) return;

    setIsLoading(true);
    try {
      const portalUrl = await createPortalSession({
        userId: userData._id,
      });

      // Redirect to Stripe customer portal
      window.location.href = portalUrl;
    } catch (error) {
      console.error("Error creating portal session:", error);
      alert("Failed to access billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while user data is being fetched
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-2">
            Loading subscription plans...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Get monthly credits and unlock premium features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans?.map((plan) => {
          const Icon = PLAN_ICONS[plan.planId as keyof typeof PLAN_ICONS] || Zap;
          return (
            <Card
              key={plan.planId}
              className={`relative transition-all hover:shadow-lg ${selectedPlan === plan.planId
                ? "ring-2 ring-primary"
                : "hover:ring-1 hover:ring-primary/50"
                } ${plan.isPopular ? "border-primary" : ""}`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.monthlyCredits.toLocaleString()} credits/month
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">${(plan.price / 100).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.planId)}
                  disabled={isLoading}
                  variant={plan.isPopular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={handleManageSubscription}
          disabled={isLoading}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Billing
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">Subscription Benefits:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Monthly credit allocation (never expires)</li>
          <li>• Higher quality video options</li>
          <li>• Priority processing queue</li>
          <li>• Advanced analytics and insights</li>
          <li>• Cancel anytime, no commitment</li>
        </ul>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Secure billing powered by Stripe</p>
        <p>All prices in USD. Cancel anytime from your billing portal.</p>
      </div>
    </div>
  );
} 