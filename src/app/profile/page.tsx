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
  Shield,
  Settings,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      await user.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password updated successfully");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Failed to update password. Please check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
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
          <Card className="bg-gray-900/30 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <span>Profile Information</span>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProfile}
                    className="border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">
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
                    <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
                      {user.firstName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">
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
                    <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
                      {user.lastName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Email Address
                  </Label>
                  <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white flex items-center justify-between">
                    <span>{user.emailAddresses[0]?.emailAddress}</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Verified
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Member Since
                  </Label>
                  <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
                    {formatDate(currentUser.createdAt)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="border-gray-700 hover:bg-gray-800 text-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="bg-gray-900/30 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span>Security</span>
                </div>
                {!isChangingPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                    className="border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white">
                    ••••••••••••
                  </div>
                  <p className="text-xs text-gray-500">
                    Last updated: {(() => {
                      const date = user.passwordEnabled ? user.updatedAt : user.createdAt;
                      if (!date) return 'Never';
                      return formatDate(typeof date === 'number' ? date : date.getTime());
                    })()}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-300">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white focus:border-blue-500 pr-10"
                        placeholder="Enter your current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-300">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white focus:border-blue-500 pr-10"
                        placeholder="Enter your new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white focus:border-blue-500 pr-10"
                        placeholder="Confirm your new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelPasswordChange}
                      disabled={isLoading}
                      className="border-gray-700 hover:bg-gray-800 text-gray-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
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