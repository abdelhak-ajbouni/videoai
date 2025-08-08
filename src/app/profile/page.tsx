"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  Check,
  X,
  AlertTriangle,
  Crown
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "convex/react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscription = useQuery(
    api.subscriptions.getCurrentSubscription,
    user ? { clerkId: user.id } : "skip"
  );

  // Actions
  const cancelSubscriptionAction = useAction(api.stripe.cancelSubscriptionAtPeriodEnd);
  const reactivateSubscriptionAction = useAction(api.stripe.reactivateSubscription);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading..." />
        </div>
      </AppLayout>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEditProfile = () => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    });
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    setIsLoading(true);
    try {
      await user.update({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };


  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId || !user?.id) {
      toast.error("No active subscription found");
      return;
    }

    setIsCancellingSubscription(true);
    try {
      await cancelSubscriptionAction({
        clerkId: user.id,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      });
      toast.success("Subscription will be canceled at the end of your billing period");
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.stripeSubscriptionId || !user?.id) {
      toast.error("No subscription found");
      return;
    }

    setIsCancellingSubscription(true);
    try {
      await reactivateSubscriptionAction({
        clerkId: user.id,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      });
      toast.success("Subscription reactivated successfully");
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error("Failed to reactivate subscription");
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  return (
    <AppLayout>
      <div className=" bg-gray-950">
        {/* Header */}
        <div className="px-6 py-8">
          <h1 className="text-2xl font-semibold text-white/95 mb-1">
            Profile Settings
          </h1>
          <p className="text-gray-400 text-sm">
            Manage your account information and preferences
          </p>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {/* Profile Information */}
          <Card className="bg-gray-900 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-white" />
                  <span>Profile Information</span>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProfile}
                    className="border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white"
                  >
                    <Settings className="h-4 w-4 mr-2 text-white" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-semibold">
                    {user.firstName?.[0] || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300 font-medium">
                    First Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="text-white text-lg">
                      {user.firstName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300 font-medium">
                    Last Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="text-white text-lg">
                      {user.lastName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium">
                    Email Address
                  </Label>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-lg">{user.emailAddresses[0]?.emailAddress}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium">
                    Member Since
                  </Label>
                  <div className="text-white text-lg">
                    {formatDate(currentUser.createdAt)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Check className="h-4 w-4 mr-2 text-white" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="border-gray-700 hover:bg-gray-800 text-gray-300"
                  >
                    <X className="h-4 w-4 mr-2 text-white" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Subscription Management */}
          <Card className="bg-gray-900 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Crown className="h-5 w-5 text-white" />
                <span>Subscription Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription ? (
                <div className="space-y-6">
                  {/* Plan Overview */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white capitalize">
                            {subscription.tier} Plan
                          </h3>
                          <p className="text-blue-400 font-medium">
                            {subscription.planDetails ?
                              `$${(subscription.planDetails.price / 100).toFixed(2)}/month` :
                              'Loading...'
                            }
                          </p>
                        </div>
                      </div>
                      {subscription.cancelAtPeriodEnd ? (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Ending Soon
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Next Billing</p>
                        <p className="text-white">
                          {subscription.currentPeriodEnd ?
                            new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            }) :
                            'Not available'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Status</p>
                        <p className="text-white">
                          {subscription.cancelAtPeriodEnd ? 'Canceling' : 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Status */}
                  {subscription.cancelAtPeriodEnd ? (
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-orange-400" />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-orange-400 font-semibold text-lg">Subscription Ending</h4>
                            <p className="text-gray-300 mt-1">
                              Your subscription will end on{' '}
                              <span className="font-semibold text-white">
                                {subscription.currentPeriodEnd ?
                                  new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) :
                                  'the end of your current billing period'
                                }
                              </span>
                              . You&apos;ll keep full access until then.
                            </p>
                          </div>
                          <Button
                            onClick={handleReactivateSubscription}
                            disabled={isCancellingSubscription}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Crown className="h-4 w-4 mr-2 text-white" />
                            Reactivate Subscription
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-semibold text-lg mb-2">Manage Subscription</h4>
                          <p className="text-gray-400">
                            Need to make changes? You can cancel your subscription at any time.
                          </p>
                        </div>
                        <Button
                          onClick={handleCancelSubscription}
                          disabled={isCancellingSubscription}
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                        >
                          <X className="h-4 w-4 mr-2 text-red-400" />
                          Cancel Subscription
                        </Button>
                        <p className="text-sm text-gray-500">
                          You&apos;ll keep access to all features until your current billing period ends.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Free Plan Overview */}
                  <div className="bg-gradient-to-r from-gray-700/20 to-gray-600/20 border border-gray-600/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            Free Plan
                          </h3>
                          <p className="text-gray-400 font-medium">
                            $0.00/month
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
                        Active
                      </Badge>
                    </div>

                    <p className="text-gray-400 mb-4">
                      You&apos;re currently on the free plan. Upgrade to get monthly credits and access to premium features.
                    </p>
                  </div>

                  {/* Upgrade Section */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold text-lg mb-2">Upgrade to Premium</h4>
                        <p className="text-gray-300">
                          Get monthly credits, priority processing, and access to the latest AI models.
                        </p>
                      </div>
                      <Button
                        onClick={() => window.location.href = "/pricing"}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        <Crown className="h-4 w-4 mr-2 text-white" />
                        View Plans
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}