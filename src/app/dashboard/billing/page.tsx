"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loading";
import {
  CreditCard,
  Crown,
  Zap,
  Check,
  Coins,
  TrendingUp,
  Download,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BillingPage() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading billing information..." />
      </div>
    );
  }

  const subscriptionPlans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      credits: 10,
      description: "Perfect for trying out VideoAI",
      features: [
        "10 one-time credits",
        "Standard quality videos only",
        "Community support",
        "Basic video library"
      ],
      isPopular: false,
      current: currentUser.subscriptionTier === "free"
    },
    {
      id: "starter",
      name: "Starter",
      price: 9.99,
      credits: 100,
      description: "Great for content creators",
      features: [
        "100 monthly credits",
        "HD quality videos",
        "Priority support",
        "Advanced video library",
        "Download in multiple formats"
      ],
      isPopular: true,
      current: currentUser.subscriptionTier === "starter"
    },
    {
      id: "pro",
      name: "Pro",
      price: 29.99,
      credits: 500,
      description: "For professional creators",
      features: [
        "500 monthly credits",
        "HD quality videos",
        "Priority processing",
        "Advanced analytics",
        "Custom video watermarks",
        "API access"
      ],
      isPopular: false,
      current: currentUser.subscriptionTier === "pro"
    },
    {
      id: "business",
      name: "Business",
      price: 99.99,
      credits: 2000,
      description: "For teams and enterprises",
      features: [
        "2000 monthly credits",
        "4K quality videos",
        "Fastest processing",
        "Team management",
        "White-label options",
        "Dedicated support",
        "Full API access"
      ],
      isPopular: false,
      current: currentUser.subscriptionTier === "business"
    }
  ];

  const creditPackages = [
    { credits: 50, price: 9.99, bonus: 0 },
    { credits: 100, price: 18.99, bonus: 5 },
    { credits: 250, price: 44.99, bonus: 15 },
    { credits: 500, price: 84.99, bonus: 35 },
  ];

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement Stripe subscription checkout
      toast.info("Stripe integration coming soon!");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = async (packageInfo: { credits: number; price: number; bonus: number }) => {
    setIsLoading(true);
    try {
      // TODO: Implement Stripe one-time payment checkout
      toast.info("Credit purchase coming soon!");
    } catch (error) {
      console.error("Credit purchase error:", error);
      toast.error("Failed to purchase credits");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="text-gray-600">Manage your plan and purchase additional credits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Current Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Current Plan Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{currentUser.credits}</p>
                <p className="text-sm text-gray-600">Credits Available</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 capitalize">{currentUser.subscriptionTier}</p>
                <p className="text-sm text-gray-600">Current Plan</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{currentUser.totalCreditsUsed}</p>
                <p className="text-sm text-gray-600">Total Used</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {currentUser.subscriptionStatus === "active" ? "Active" : "Inactive"}
                </p>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-gray-600">Unlock more features and get more credits with a subscription</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500' : ''} ${plan.current ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                {plan.current && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-3 py-1">Current Plan</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-4">
                    {plan.id === "free" && <Coins className="h-8 w-8 text-gray-500" />}
                    {plan.id === "starter" && <Zap className="h-8 w-8 text-blue-500" />}
                    {plan.id === "pro" && <Crown className="h-8 w-8 text-purple-500" />}
                    {plan.id === "business" && <TrendingUp className="h-8 w-8 text-amber-500" />}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600">
                      {plan.credits} {plan.price === 0 ? 'one-time' : 'monthly'} credits
                    </p>
                  </div>

                  <Separator />

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-4"
                    variant={plan.current ? "outline" : "default"}
                    disabled={plan.current || isLoading}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {plan.current ? "Current Plan" : plan.price === 0 ? "Current Plan" : "Upgrade Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Buy Additional Credits</h2>
            <p className="text-gray-600">Need more credits? Purchase them individually without a subscription</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPackages.map((pkg, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Coins className="h-8 w-8 text-yellow-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {pkg.credits + pkg.bonus} Credits
                  </CardTitle>
                  {pkg.bonus > 0 && (
                    <Badge variant="secondary" className="mx-auto">
                      +{pkg.bonus} Bonus
                    </Badge>
                  )}
                  <div className="text-2xl font-bold text-blue-600">
                    ${pkg.price}
                  </div>
                  <p className="text-sm text-gray-500">
                    ${(pkg.price / (pkg.credits + pkg.bonus)).toFixed(3)} per credit
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => handleBuyCredits(pkg)}
                  >
                    Purchase Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No billing history</h3>
              <p className="text-gray-600 mb-4">Your invoices and receipts will appear here</p>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 