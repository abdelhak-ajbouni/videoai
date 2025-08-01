"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  FileText,
  CreditCard,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Receipt,
  History
} from "lucide-react";

export function InvoiceManagement() {
  const [isLoading, setIsLoading] = useState(false);

  // Get current user data
  const userData = useQuery(api.users.getCurrentUser);
  const subscriptionHistory = useQuery(
    api.subscriptions.getSubscriptionHistory,
    userData?.clerkId ? { clerkId: userData.clerkId } : "skip"
  );
  const creditHistory = useQuery(
    api.userProfiles.getCreditHistory,
    userData?.clerkId ? { clerkId: userData.clerkId } : "skip"
  );
  const createPortalSession = useAction(api.stripe.createCustomerPortalSession);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "past_due":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleManageBilling = async () => {
    if (!userData) return;

    setIsLoading(true);
    try {
      const portalUrl = await createPortalSession({
        clerkId: userData.clerkId,
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

  const handleDownloadInvoices = () => {
    // This would typically redirect to Stripe customer portal for invoice downloads
    handleManageBilling();
  };

  const handleManagePaymentMethods = () => {
    // This would typically redirect to Stripe customer portal for payment method management
    handleManageBilling();
  };

  // Show loading state while user data is being fetched
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground mt-2">
            Loading billing information...
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
        <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage your invoices, payment methods, and billing history
        </p>
      </div>

      {/* Billing Information Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Email</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{userData.email}</div>
            <p className="text-xs text-muted-foreground">
              Primary billing contact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Tier</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium capitalize">
              {userData.subscriptionTier}
            </div>
            <p className="text-xs text-muted-foreground">
              Current subscription tier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDate(userData.createdAt)}
            </div>
            <p className="text-xs text-muted-foreground">
              Account creation date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your billing and payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={handleDownloadInvoices}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Download Invoices</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleManagePaymentMethods}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Payment Methods</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Manage Billing</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">Subscription History</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription History</CardTitle>
              <CardDescription>
                Your subscription changes and billing cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionHistory && subscriptionHistory.length > 0 ? (
                <div className="space-y-3">
                  {subscriptionHistory.map((subscription) => (
                    <div
                      key={subscription._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(subscription.status)}
                        <div className="flex flex-col">
                          <div className="font-medium capitalize">{subscription.tier} Plan</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(subscription.createdAt)} - {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "Active"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                          {subscription.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {subscription.monthlyCredits} credits/month
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No subscription history</p>
                  <p className="text-sm">Your subscription changes will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your credit purchases and usage history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creditHistory && creditHistory.length > 0 ? (
                <div className="space-y-3">
                  {creditHistory.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={transaction.amount > 0 ? "default" : "secondary"}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount} credits
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Balance: {transaction.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your credit purchases and usage will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Billing Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Support</CardTitle>
          <CardDescription>
            Get help with billing questions and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Invoice Management</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All invoices are available in your Stripe customer portal</li>
                <li>• Download invoices and receipts for your records</li>
                <li>• View detailed billing history and payment status</li>
                <li>• Access tax documents and financial reports</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Payment Methods</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add, update, or remove payment methods</li>
                <li>• Set default payment method for subscriptions</li>
                <li>• View payment method usage history</li>
                <li>• Manage billing address and tax information</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium">Need Help?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              For billing questions, payment issues, or account disputes, please contact our support team.
              All billing operations are securely handled through Stripe&apos;s customer portal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 