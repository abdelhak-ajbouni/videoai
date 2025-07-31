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
import { Progress } from "@/components/ui/progress";

import { Video, Clock, Sparkles, Play, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { VideoModal } from "@/components/VideoModal";
import { useRouter } from "next/navigation";

export default function GeneratePage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  
  // Get videos in different states
  const pendingVideos = useQuery(
    api.videos.getVideosByStatus,
    currentUser ? { status: "pending" } : "skip"
  );
  const processingVideos = useQuery(
    api.videos.getVideosByStatus,
    currentUser ? { status: "processing" } : "skip"
  );
  const completedVideos = useQuery(
    api.videos.getVideosByStatus,
    currentUser ? { status: "completed" } : "skip"
  );
  
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const [progress, setProgress] = useState(0);

  // Get the current video (most recent pending or processing)
  const currentVideo = processingVideos?.[0] || pendingVideos?.[0] || completedVideos?.[0] || null;
  
  // Simulate progress for processing videos
  useEffect(() => {
    if (processingVideos && processingVideos.length > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 3;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (completedVideos && completedVideos.length > 0) {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [processingVideos, completedVideos]);

  // Redirect to landing page if user is not authenticated
  useEffect(() => {
    if (isLoaded && currentUser === null) {
      router.push("/");
    }
  }, [isLoaded, currentUser, router]);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || currentUser === undefined) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading video generation..." />
        </div>
      </AppLayout>
    );
  }

  // This should not happen due to the useEffect redirect, but keep as fallback
  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Redirecting..." />
        </div>
      </AppLayout>
    );
  }

  const handleVideoClick = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      setSelectedVideo(video);
    }
  };

  const handleDownload = (video: Doc<"videos">) => {
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

  const getVideoStatus = () => {
    if (processingVideos && processingVideos.length > 0) return 'processing';
    if (pendingVideos && pendingVideos.length > 0) return 'pending';
    if (completedVideos && completedVideos.length > 0) return 'completed';
    return 'none';
  };

  const status = getVideoStatus();

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
        <div className="px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white/95 mb-1">
              Generate Video
            </h1>
            <p className="text-gray-400 text-sm">
              Create stunning videos with AI
            </p>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Video Generation Form */}
            <div>
              <div className="sticky top-8">
                <VideoGenerationForm />
              </div>
            </div>

            {/* Right Side - Current Video Player */}
            <div>
              <div className="sticky top-8">
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Video Player Area */}
                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
                      {status === 'none' && (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Your generated video will appear here
                          </p>
                        </div>
                      )}

                      {status === 'pending' && (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8 text-yellow-400" />
                          </div>
                          <p className="text-yellow-400 text-sm font-medium mb-2">
                            Video Queued
                          </p>
                          <p className="text-gray-400 text-xs">
                            Waiting to start processing...
                          </p>
                        </div>
                      )}

                      {status === 'processing' && (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                          </div>
                          <p className="text-blue-400 text-sm font-medium mb-2">
                            Generating Video
                          </p>
                          <p className="text-gray-400 text-xs mb-4">
                            This may take a few minutes...
                          </p>
                          <div className="w-48 mx-auto">
                            <Progress 
                              value={progress} 
                              className="h-2 bg-gray-800"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {Math.round(progress)}% complete
                            </p>
                          </div>
                        </div>
                      )}

                      {status === 'completed' && currentVideo?.videoUrl && (
                        <div className="relative w-full h-full">
                          <video
                            className="w-full h-full object-cover"
                            poster={currentVideo.thumbnailUrl}
                            controls
                            preload="metadata"
                          >
                            <source src={currentVideo.videoUrl} type="video/mp4" />
                          </video>
                        </div>
                      )}

                      {status === 'completed' && !currentVideo?.videoUrl && (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-400" />
                          </div>
                          <p className="text-red-400 text-sm font-medium mb-2">
                            Generation Failed
                          </p>
                          <p className="text-gray-400 text-xs">
                            Please try generating again
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    {currentVideo && (
                      <div className="p-2 lg:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-white font-medium mb-1">
                              {currentVideo.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{currentVideo.duration}s</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="capitalize">{currentVideo.quality}</span>
                              </div>
                            </div>
                          </div>
                          
                          {status === 'completed' && (
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span className="text-sm text-gray-400">Ready</span>
                              </div>
                              {currentVideo.videoUrl && (
                                <Button
                                  onClick={() => handleDownload(currentVideo)}
                                  size="icon"
                                  className="bg-gray-800/50 hover:bg-gray-700/70 text-white border-gray-700/50 h-8 w-8"
                                  variant="outline"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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