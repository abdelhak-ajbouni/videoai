"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VideoGenerationForm } from "@/components/VideoGenerationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";

import { Info } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { CurrentVideoPlayer } from "@/components/CurrentVideoPlayer";
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


  const [trackingVideoId, setTrackingVideoId] = useState<string | null>(null);

  // Handle Stripe redirect parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const credits = searchParams.get('credits');
    const subscription = searchParams.get('subscription');
    const plan = searchParams.get('plan');
    const planChange = searchParams.get('plan_change');
    const canceled = searchParams.get('canceled');

    if (success === 'true' && credits) {
      toast.success(`Successfully purchased ${credits} credits!`);
    } else if (subscription === 'success' && plan) {
      toast.success(`Successfully subscribed to ${plan} plan!`);
    } else if (planChange === 'success' && plan) {
      toast.success(`Successfully upgraded to ${plan} plan!`);
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

  // Find the video we're tracking (if any)
  const currentVideo = trackingVideoId ?
    [...(pendingVideos || []), ...(processingVideos || []), ...(completedVideos || [])].find(v => v._id === trackingVideoId) || null :
    null;

  // Handle video creation callback
  const handleVideoCreated = (videoId: string) => {
    setTrackingVideoId(videoId);
  };

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




  const getVideoStatus = () => {
    if (currentVideo) {
      return currentVideo.status;
    }
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
                <VideoGenerationForm onVideoCreated={handleVideoCreated} />
              </div>
            </div>

            {/* Right Side - Current Video Player */}
            <div>
              <div className="sticky top-8 space-y-6">
                <CurrentVideoPlayer
                  currentVideo={currentVideo}
                  status={status}
                />

                {/* Quick Tips */}
                <Card className="bg-gray-900 backdrop-blur-sm border-gray-800/50">
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