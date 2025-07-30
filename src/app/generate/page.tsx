"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { VideoGenerationForm } from "@/components/VideoGenerationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";

import { Video, Clock, Sparkles, Play, Zap, Download, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { VideoModal } from "@/components/VideoModal";

export default function GeneratePage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const recentVideos = useQuery(
    api.videos.getVideosByStatus,
    currentUser ? { status: "completed" } : "skip"
  );
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading video generation..." />
        </div>
      </AppLayout>
    );
  }

  // Get recent videos (last 6 for better showcase)
  const recentCompletedVideos = recentVideos?.slice(0, 6) || [];

  const handleVideoClick = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      setSelectedVideo(video);
    }
  };

  const handleDownload = (video: Doc<"videos">, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="px-4 py-8">
          {/* Top Header with Credits */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Amazing Videos
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Transform your ideas into stunning videos with AI
              </p>
            </div>
          </div>

          {/* Main Layout - 40% Left, 60% Right */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Left Side - Video Generation Form (40%) */}
            <div className="lg:col-span-4">
              <div className="sticky top-8">
                <VideoGenerationForm />
              </div>
            </div>

            {/* Right Side - Recent Videos (60%) */}
            <div className="lg:col-span-6">
              <div className="space-y-6">
                {/* Recent Videos Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Recent Videos
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your latest AI-generated content
                      </p>
                    </div>
                  </div>
                  <Link href="/library">
                    <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Zap className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </Link>
                </div>

                {/* Videos Grid */}
                {recentCompletedVideos.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <CardContent className="text-center py-16">
                      <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto mb-4">
                        <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No videos yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                        Generate your first video using the form on the left to see your creations here
                      </p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Sparkles className="h-4 w-4" />
                        <span>Your AI-generated videos will appear here</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {recentCompletedVideos.map((video) => (
                      <Card
                        key={video._id}
                        className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer"
                        onClick={() => handleVideoClick(video)}
                      >
                        {/* Video Thumbnail */}
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          {video.videoUrl ? (
                            <video
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              poster={video.thumbnailUrl}
                              muted
                            >
                              <source src={video.videoUrl} type="video/mp4" />
                            </video>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-12 w-12 text-gray-400" />
                            </div>
                          )}

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <div className="p-3 rounded-full bg-white bg-opacity-90 group-hover:bg-opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
                              <Play className="h-5 w-5 text-gray-800 ml-0.5" />
                            </div>
                          </div>

                          {/* Quality Badge */}
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-1 text-xs font-medium bg-black bg-opacity-70 text-white rounded-full">
                              {video.quality}
                            </span>
                          </div>
                        </div>

                        {/* Video Info */}
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {video.title}
                          </h3>

                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{video.duration}s</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {video.creditsCost} credits
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoClick(video);
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={(e) => handleDownload(video, e)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Quick Stats */}
                {recentCompletedVideos.length > 0 && (
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {recentCompletedVideos.length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Videos
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {recentCompletedVideos.reduce((sum, video) => sum + (Number(video.creditsCost) || 0), 0)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Credits Used
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {Math.round(recentCompletedVideos.reduce((sum, video) => sum + (Number(video.duration) || 0), 0) / 60 * 10) / 10}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Minutes Created
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Modal */}
        <VideoModal
          video={selectedVideo}
          onClose={closeModal}
          showDownloadButton={true}
          onDownload={handleDownload}
          variant="detailed"
        />
      </div>
    </AppLayout>
  );
} 