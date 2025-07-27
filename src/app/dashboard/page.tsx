"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VideoGenerationForm } from "@/components/VideoGenerationForm";
import { VideoLibrary } from "@/components/VideoLibrary";
import { VideoAnalytics } from "@/components/VideoAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { CreditCard, Video, Plus, User, Settings, TrendingUp, Clock, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const recentVideos = useQuery(
    api.videos.getVideosByStatus,
    currentUser ? { status: "completed" } : "skip"
  );
  const [activeTab, setActiveTab] = useState("generate");

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Loading your dashboard..." />
      </div>
    );
  }

  // Get recent videos (last 3)
  const recentCompletedVideos = recentVideos?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Create amazing videos with AI
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Credits</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentUser.credits}
                </p>
              </div>
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <SignOutButton>
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {activeTab === "generate" && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Available Credits</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{currentUser.credits}</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Video className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Videos Created</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">{recentVideos?.length || 0}</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Total Credits Used</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{currentUser.totalCreditsUsed}</p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Settings className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Current Plan</span>
                  </div>
                  <p className="text-lg font-bold text-amber-600 mt-1 capitalize">{currentUser.subscriptionTier}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("generate")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "generate"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Generate Video
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "library"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Video className="h-4 w-4 inline mr-2" />
              My Videos
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "analytics"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <VideoGenerationForm />
            </div>

            {/* Recent Videos Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Videos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentCompletedVideos.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No completed videos yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentCompletedVideos.map((video) => (
                        <div key={video._id} className="border rounded-lg p-3">
                          <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {video.duration}s • {video.quality} • {video.creditsCost} credits
                          </p>
                          {video.videoUrl && (
                            <video
                              className="w-full h-16 object-cover rounded mt-2"
                              poster={video.thumbnailUrl}
                              muted
                            >
                              <source src={video.videoUrl} type="video/mp4" />
                            </video>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab("library")}
                      >
                        View All Videos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="max-w-7xl mx-auto">
            <VideoLibrary />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="max-w-7xl mx-auto">
            <VideoAnalytics />
          </div>
        )}
      </div>
    </div>
  );
} 