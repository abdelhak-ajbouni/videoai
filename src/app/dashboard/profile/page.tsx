"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  Trash2,
  Download
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading your profile..." />
        </div>
      </DashboardLayout>
    );
  }

  const handleUpdateProfile = async () => {
    try {
      if (user && name.trim()) {
        await user.update({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || undefined,
        });

        setIsEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    const badges = {
      free: <Badge variant="secondary">Free</Badge>,
      starter: <Badge className="bg-blue-100 text-blue-800">Starter</Badge>,
      pro: <Badge className="bg-purple-100 text-purple-800">Pro</Badge>,
      business: <Badge className="bg-amber-100 text-amber-800">Business</Badge>,
    };
    return badges[tier as keyof typeof badges] || <Badge variant="secondary">{tier}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600">Manage your account information and preferences</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  {user?.imageUrl && (
                    <Image
                      src={user.imageUrl}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full border-2 border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setName(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {isEditing && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleUpdateProfile}>
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Email:</span>
                    <span>{user?.primaryEmailAddress?.emailAddress}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Member since:</span>
                    <span>{formatDistanceToNow(new Date(currentUser.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Account Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{currentUser.credits}</p>
                    <p className="text-sm text-gray-600">Available Credits</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-700">{currentUser.totalCreditsUsed}</p>
                    <p className="text-sm text-gray-600">Total Used</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-center mb-1">
                      {getSubscriptionBadge(currentUser.subscriptionTier)}
                    </div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-semibold text-red-800">Export Account Data</h4>
                    <p className="text-sm text-red-600">
                      Download all your account data for your records
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-semibold text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-600">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 