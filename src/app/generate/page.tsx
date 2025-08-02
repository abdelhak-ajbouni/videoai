"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { VideoGenerationForm } from "@/components/VideoGenerationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { Progress } from "@/components/ui/progress";

import { Video, Clock, Download, Loader2, AlertCircle, Info } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { VideoModal } from "@/components/VideoModal";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function GeneratePageContent() {
  const { isLoaded, isSignedIn } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const searchParams = useSearchParams();

  // Get videos in different states
  const pendingVideos = useQuery(
    api.videos.getVideosByStatus,
    isLoaded && currentUser ? { status: "pending" } : "skip"
  );
  const processingVideos = useQuery(
    api.videos.getVideosByStatus,
    isLoaded && currentUser ? { status: "processing" } : "skip"
  );
  const completedVideos = useQuery(
    api.videos.getVideosByStatus,
    isLoaded && currentUser ? { status: "completed" } : "skip"
  );


  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const [progress, setProgress] = useState(0);
  const [lastCompletedVideoId, setLastCompletedVideoId] = useState<string | null>(null);

  // Handle Stripe redirect parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const credits = searchParams.get('credits');
    const subscription = searchParams.get('subscription');
    const plan = searchParams.get('plan');
    const planChange = searchParams.get('plan_change');
    const canceled = searchParams.get('canceled');

    if (success === 'true' && credits) {
      toast.success(`Successfully purchased ${credits} credits! You can now generate videos.`);
    } else if (subscription === 'success' && plan) {
      toast.success(`Successfully subscribed to ${plan} plan! You now have access to more features.`);
    } else if (planChange === 'success' && plan) {
      toast.success(`Successfully upgraded to ${plan} plan! You now have access to more features.`);
    } else if (canceled === 'true') {
      toast.error('Payment was canceled');
    }

    // Clear URL parameters after showing the message
    if (success || subscription || planChange || canceled) {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Get the current video (most recent pending or processing)
  const currentVideo = processingVideos?.[0] || pendingVideos?.[0] || completedVideos?.[0] || null;

  // Better progress tracking
  useEffect(() => {
    if (processingVideos && processingVideos.length > 0) {
      // Start from 0 when a new video starts processing
      setProgress(0);

      const interval = setInterval(() => {
        setProgress(prev => {
          // More realistic progress based on time elapsed
          const newProgress = prev + Math.random() * 2 + 1; // Progress 1-3% each second
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (completedVideos && completedVideos.length > 0) {
      setProgress(100);

      // Show completion toast for newly completed videos (only once per video)
      const latestCompleted = completedVideos[0];
      if (latestCompleted && latestCompleted.status === 'completed' &&
        latestCompleted._id !== lastCompletedVideoId) {
        setLastCompletedVideoId(latestCompleted._id);
      }
    } else {
      setProgress(0);
    }
  }, [processingVideos, completedVideos, lastCompletedVideoId]);

  // Ensure user profile exists on first load
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUser === null) {
      ensureUserExists();
    }
  }, [isLoaded, isSignedIn, currentUser, ensureUserExists]);

  // Show loading while authentication or user data is loading
  if (!isLoaded || currentUser === undefined) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading video generation..." />
        </div>
      </AppLayout>
    );
  }

  // Show account setup while user profile is being created
  if (currentUser === null) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Setting up your account..." />
        </div>
      </AppLayout>
    );
  }


  const handleDownload = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `video-${video._id}.mp4`;
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
              <div className="sticky top-8 space-y-6">
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
                            controls
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              const videoEl = e.target as HTMLVideoElement;
                              videoEl.currentTime = 0.01; // Seek to 0.5 seconds for better thumbnail
                            }}
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
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium mb-1 line-clamp-2">
                              {currentVideo.prompt}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{currentVideo.duration}s</span>
                              </div>
                              <div className="flex items-center space-x-1">

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

                {/* Quick Tips */}
                <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-sm font-medium text-white/90">
                      <Info className="h-4 w-4 text-blue-400" />
                      <span>Quick Tips</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-gray-300">
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                        <span>Be specific about scenes, actions, and visual style for better results</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                        <span>Include camera movements like &quot;close-up&quot;, &quot;wide shot&quot;, or &quot;tracking shot&quot;</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                        <span>Mention lighting and mood to enhance the atmosphere</span>
                      </div>
                    </div>
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

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading..." />
        </div>
      </AppLayout>
    }>
      <GeneratePageContent />
    </Suspense>
  );
} 