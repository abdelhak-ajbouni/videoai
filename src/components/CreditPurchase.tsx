"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, CreditCard, Zap, Star, Crown } from "lucide-react";

// Icon mapping for credit packages
const PACKAGE_ICONS = {
  small: Zap,
  medium: Star,
  large: Crown,
  xlarge: Crown,
} as const;

export function CreditPurchase() {
  const { user } = useUser();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user data and credit packages
  const userData = useQuery(api.users.getCurrentUser);
  const creditPackages = useQuery(api.creditPackages.getActivePackages);
  const createCheckoutSession = useAction(api.stripe.createCreditCheckoutSession);

  const handlePurchase = async (packageId: string) => {
    if (!userData) return;

    setIsLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession({
        userId: userData._id,
        packageId: packageId as any,
      });

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while user data is being fetched
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Purchase Credits</h2>
          <p className="text-muted-foreground mt-2">
            Loading credit packages...
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
        <h2 className="text-3xl font-bold tracking-tight">Purchase Credits</h2>
        <p className="text-muted-foreground mt-2">
          Choose a credit package to continue generating amazing videos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {creditPackages?.map((pkg) => {
          const Icon = PACKAGE_ICONS[pkg.packageId as keyof typeof PACKAGE_ICONS] || Zap;
          const priceInDollars = pkg.price / 100; // Convert cents to dollars
          const pricePerCredit = priceInDollars / pkg.credits;

          return (
            <Card
              key={pkg.packageId}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${selectedPackage === pkg.packageId
                ? "ring-2 ring-primary"
                : "hover:ring-1 hover:ring-primary/50"
                }`}
              onClick={() => setSelectedPackage(pkg.packageId)}
            >
              {pkg.isPopular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription>
                  {pkg.credits.toLocaleString()} credits
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center space-y-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">${priceInDollars.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    ${pricePerCredit.toFixed(2)} per credit
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg.packageId);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Purchase
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">What you get with credits:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Generate videos with Google Veo-3 (Premium) or Luma Ray-2 (Budget)</li>
          <li>• Choose from different quality levels (Standard, High, Ultra)</li>
          <li>• Download videos in high quality MP4 format</li>
          <li>• Store videos in your personal library</li>
          <li>• Credits never expire</li>
        </ul>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Secure payment powered by Stripe</p>
        <p>All prices in USD. Credits are non-refundable.</p>
      </div>
    </div>
  );
} 