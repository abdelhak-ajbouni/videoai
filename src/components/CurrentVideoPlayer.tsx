"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock, Download, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CurrentVideoPlayerProps {
  currentVideo: Doc<"videos"> | null;
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
}

export function CurrentVideoPlayer({ currentVideo, status }: CurrentVideoPlayerProps) {
  const handleDownload = async (video: Doc<"videos">) => {
    if (!video.videoUrl) {
      toast.error("Video URL not available");
      return;
    }

    try {
      // Fetch the video file
      const response = await fetch(video.videoUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      // Convert to blob
      const blob = await response.blob();

      // Create object URL
      const objectUrl = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `video-${video._id}.mp4`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      toast.success("Video downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download video. Please try again.");
    }
  };

  return (
    <Card className="bg-gray-900 backdrop-blur-sm border-gray-800/50 overflow-hidden">
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
              <p className="text-gray-400 text-xs">
                This may take a few minutes...
              </p>
            </div>
          )}

          {status === 'completed' && currentVideo?.videoUrl && (
            <div className="relative w-full h-full">
              <video
                className="w-full h-full object-contain"
                controls
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const videoEl = e.target as HTMLVideoElement;
                  videoEl.currentTime = 0.01; // Seek to 0.01 seconds for better thumbnail
                }}
                onError={(e) => {
                  console.error('Video failed to load:', e);
                  toast.error('Video failed to load. Please try again.');
                  // You can add additional error handling here, such as:
                  // - Showing a user-friendly error message
                  // - Triggering a retry mechanism
                  // - Logging to an error tracking service
                }}
              >
                <source src={currentVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
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
            <p className="text-gray-300 text-sm mb-4">
              {currentVideo.prompt}
            </p>

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
        )}
      </CardContent>
    </Card>
  );
}