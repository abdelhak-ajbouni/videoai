"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VideoGenerationForm } from "@/components/VideoGenerationForm";
import { VideoLibrary } from "@/components/VideoLibrary";
import { VideoAnalytics } from "@/components/VideoAnalytics";
import { Button } from "@/components/ui/button";
import { ButtonShowcase } from "@/components/ui/button-showcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardShowcase } from "@/components/ui/card-showcase";
import { Loading } from "@/components/ui/loading";
import { LoadingShowcase } from "@/components/ui/loading-showcase";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavigationShowcase } from "@/components/navigation/navigation-showcase";
import { HeaderShowcase } from "@/components/navigation/header-showcase";
import { LayoutShowcase } from "@/components/layouts/layout-showcase";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CreditCard, Video, Plus, User, TrendingUp, Clock, LogOut, Sparkles } from "lucide-react";
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading your dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  // Get recent videos (last 3)
  const recentCompletedVideos = recentVideos?.slice(0, 3) || [];

  return (
    <DashboardLayout>
      <div className="lg:p-0 p-4">
        {/* Welcome Hero Section */}
        {activeTab === "generate" && (
          <div className="container mx-auto px-4 py-8">
            <WelcomeHero />
          </div>
        )}

        {/* Compact Header for other tabs */}
        {activeTab !== "generate" && (
          <div className="bg-surface shadow-sm border-b border-border backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient-ai">
                    Welcome back, {user?.firstName}!
                  </h1>
                  <p className="text-text-secondary mt-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ai-electric-400" />
                    Create amazing videos with AI
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">Credits</p>
                    <p className="text-2xl font-bold text-ai-primary-500">
                      {currentUser.credits}
                    </p>
                  </div>
                  <ThemeToggle />
                  <Link href="/dashboard/billing">
                    <Button variant="outline" size="sm" className="hover:bg-ai-primary-50 hover:border-ai-primary-300 dark:hover:bg-ai-primary-900/20">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Credits
                    </Button>
                  </Link>
                  <Link href="/dashboard/profile">
                    <Button variant="outline" size="sm" className="hover:bg-ai-primary-50 hover:border-ai-primary-300 dark:hover:bg-ai-primary-900/20">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <SignOutButton>
                    <Button variant="outline" size="sm" className="hover:bg-ai-primary-50 hover:border-ai-primary-300 dark:hover:bg-ai-primary-900/20">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </SignOutButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards with Data Visualization */}
        {activeTab === "generate" && (
          <div className="bg-surface border-b border-border">
            <div className="container mx-auto px-4 py-6">
              <StatsCards
                creditBalance={currentUser.credits}
                videosGenerated={recentVideos?.length || 0}
                successRate={92} // Mock data - in real app this would be calculated
                totalSavings={currentUser.totalCreditsUsed * 0.02 * 0.15} // Mock calculation: 15% savings
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs with AI-themed styling */}
        <div className="bg-surface border-b border-border">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("generate")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-normal ${activeTab === "generate"
                  ? "border-ai-primary-500 text-ai-primary-600 dark:text-ai-primary-400"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-ai-primary-300"
                  }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Generate Video
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-normal ${activeTab === "library"
                  ? "border-ai-electric-500 text-ai-electric-600 dark:text-ai-electric-400"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-ai-electric-300"
                  }`}
              >
                <Video className="h-4 w-4 inline mr-2" />
                My Videos
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-normal ${activeTab === "analytics"
                  ? "border-ai-neural-500 text-ai-neural-600 dark:text-ai-neural-400"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-ai-neural-300"
                  }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("buttons")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-normal ${activeTab === "buttons"
                  ? "border-ai-electric-500 text-ai-electric-600 dark:text-ai-electric-400"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-ai-electric-300"
                  }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Buttons Demo
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

              {/* Recent Videos Sidebar with AI-themed styling */}
              <div className="space-y-6">
                <Card className="glass-card border-border-light">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-text-primary">
                      <div className="p-1.5 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                        <Clock className="h-4 w-4 text-ai-neural-600 dark:text-ai-neural-400" />
                      </div>
                      <span>Recent Videos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentCompletedVideos.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="p-3 rounded-full bg-ai-primary-50 dark:bg-ai-primary-900/20 w-fit mx-auto mb-3">
                          <Video className="h-6 w-6 text-ai-primary-400" />
                        </div>
                        <p className="text-sm text-text-secondary">
                          No completed videos yet
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                          Generate your first video to see it here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentCompletedVideos.map((video) => (
                          <div key={video._id} className="border border-border rounded-xl p-3 hover:border-ai-primary-300 transition-colors duration-normal bg-surface-elevated">
                            <h4 className="font-medium text-sm line-clamp-1 text-text-primary">{video.title}</h4>
                            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                              <span>{video.duration}s</span>
                              <span>•</span>
                              <span className="capitalize">{video.quality}</span>
                              <span>•</span>
                              <span className="text-ai-primary-500 font-medium">{video.creditsCost} credits</span>
                            </p>
                            {video.videoUrl && (
                              <video
                                className="w-full h-16 object-cover rounded-lg mt-2 border border-border"
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
                          className="w-full hover:bg-ai-primary-50 hover:border-ai-primary-300 dark:hover:bg-ai-primary-900/20 transition-colors duration-normal"
                          onClick={() => setActiveTab("library")}
                        >
                          <Video className="h-4 w-4 mr-2" />
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

          {/* Temporary: Component Showcase Demo */}
          {activeTab === "buttons" && (
            <div className="max-w-7xl mx-auto space-y-12">
              <ButtonShowcase />
              <CardShowcase />
              <LoadingShowcase />
              <NavigationShowcase />
              <HeaderShowcase />
              <LayoutShowcase />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 