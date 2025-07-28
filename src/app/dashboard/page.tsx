"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CreditCard, Video, Plus, User, TrendingUp, Clock, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const recentVideos = useQuery(
    api.videos.getVideosByStatus,
    currentUser ? { status: "completed" } : "skip"
  );

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
        <div className="container mx-auto px-4 py-8">
          <WelcomeHero />
        </div>

        {/* Enhanced Stats Cards with Data Visualization */}
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

        {/* Quick Actions */}
        <div className="bg-surface border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/generate">
                <Button className="w-full h-16 bg-gradient-ai text-white hover:shadow-ai transition-all duration-normal">
                  <Plus className="h-5 w-5 mr-2" />
                  Generate New Video
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="outline" className="w-full h-16 hover:bg-ai-electric-50 hover:border-ai-electric-300 dark:hover:bg-ai-electric-900/20">
                  <Video className="h-5 w-5 mr-2" />
                  View Video Library
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="w-full h-16 hover:bg-ai-neural-50 hover:border-ai-neural-300 dark:hover:bg-ai-neural-900/20">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
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
                    <Link href="/generate">
                      <Button className="mt-4 bg-gradient-ai text-white hover:shadow-ai">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Your First Video
                      </Button>
                    </Link>
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
                    <Link href="/library">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full hover:bg-ai-primary-50 hover:border-ai-primary-300 dark:hover:bg-ai-primary-900/20 transition-colors duration-normal"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        View All Videos
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 