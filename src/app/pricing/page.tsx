"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Crown,
  Zap,
  Star,
  Calendar,
  CreditCard,
  Package
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PricingPage() {
  const { isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch subscription plans and credit packages
  const subscriptionPlans = useQuery(api.subscriptionPlans.getActivePlans);
  const creditPackages = useQuery(api.creditPackages.getActivePackages);

  // Stripe actions
  const createSubscriptionCheckout = useAction(api.stripe.createSubscriptionCheckoutSession);
  const createCreditCheckout = useAction(api.stripe.createCreditCheckoutSession);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading..." />
        </div>
      </AppLayout>
    );
  }

  const handleSubscribe = async (planId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      toast.success("Redirecting to checkout...");
      const checkoutUrl = await createSubscriptionCheckout({
        userId: currentUser._id,
        planId: planId as "starter" | "pro" | "business",
      });
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error("Failed to start subscription");
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = async (packageId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      toast.success("Redirecting to checkout...");
      const checkoutUrl = await createCreditCheckout({
        userId: currentUser._id,
        packageId: packageId as "small" | "medium" | "large" | "xlarge",
      });
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error("Failed to purchase credits");
      console.error("Credit purchase error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'starter':
        return <Zap className="h-5 w-5" />;
      case 'pro':
        return <Star className="h-5 w-5" />;
      case 'business':
        return <Crown className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentUser?.subscriptionTier === planId.toLowerCase();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="px-6 py-8">
          <h1 className="text-2xl font-semibold text-white/95 mb-1">
            Pricing
          </h1>
          <p className="text-gray-400 text-sm">
            Choose your plan and purchase credits
          </p>
        </div>


        <div className="px-6 pb-8 space-y-12">
          {/* Subscription Plans */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Monthly Plans
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dynamic Subscription Plans */}
              {subscriptionPlans?.map((plan) => (
                <Card key={plan._id} className={`relative overflow-hidden transition-all duration-200 flex flex-col ${
                  isCurrentPlan(plan.planId) 
                    ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' 
                    : 'bg-gray-900/30 border-gray-800/50 hover:bg-gray-900/50'
                }`}>
                  <CardContent className="p-6 flex flex-col flex-1">
                    {plan.isPopular && (
                      <Badge className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        Popular
                      </Badge>
                    )}
                    
                    {isCurrentPlan(plan.planId) && (
                      <Badge className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        Current
                      </Badge>
                    )}

                    <div className="flex items-center space-x-2 mb-4">
                      {getPlanIcon(plan.planId)}
                      <h3 className="text-lg font-semibold text-white capitalize">
                        {plan.name}
                      </h3>
                    </div>

                    <div className="mb-6">
                      <div className="text-3xl font-bold text-white">
                        ${(plan.price / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">per month</div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>{plan.monthlyCredits.toLocaleString()} credits/month</span>
                      </div>
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={() => handleSubscribe(plan.planId)}
                      disabled={isCurrentPlan(plan.planId) || isLoading}
                      className={`w-full mt-auto ${
                        plan.isPopular 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'bg-white hover:bg-gray-100 text-gray-900'
                      } disabled:opacity-50`}
                    >
                      {isCurrentPlan(plan.planId) ? 'Current Plan' : `Subscribe to ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Credit Packages */}
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="h-5 w-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">
                One-Time Credit Packages
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {creditPackages?.map((pkg) => (
                <Card key={pkg._id} className="bg-gray-900/30 border-gray-800/50 hover:bg-gray-900/50 transition-all duration-200 flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Package className="h-5 w-5 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">
                        {pkg.name}
                      </h3>
                    </div>

                    <div className="mb-6">
                      <div className="text-3xl font-bold text-white">
                        ${(pkg.price / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {pkg.credits.toLocaleString()} credits
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Credits:</span>
                        <span className="text-white font-medium">
                          {pkg.credits.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Cost per credit:</span>
                        <span className="text-white font-medium">
                          ${(pkg.price / 100 / pkg.credits).toFixed(3)}
                        </span>
                      </div>
                      {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Bonus:</span>
                          <span className="text-emerald-400 font-medium">
                            +{pkg.bonusCredits} credits
                          </span>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleBuyCredits(pkg.packageId)}
                      disabled={isLoading}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium disabled:opacity-50 mt-auto"
                    >
                      Buy Credits
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}