"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Video } from "lucide-react";

interface VideoModalProps {
  video: Doc<"videos"> | null;
  onClose: () => void;
  showDownloadButton?: boolean;
  onDownload?: (video: Doc<"videos">) => void;
  variant?: "compact" | "detailed";
}

export function VideoModal({
  video,
  onClose,
  showDownloadButton = false,
  onDownload,
  variant = "detailed"
}: VideoModalProps) {
  if (!video) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(video);
    } else if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-surface-elevated rounded-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video player */}
        <div className="aspect-video">
          {video.videoUrl ? (
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              poster={video.thumbnailUrl}
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ai-primary-50 to-ai-primary-100 dark:from-ai-primary-900/20 dark:to-ai-primary-800/20 flex items-center justify-center">
              <Video className="h-16 w-16 text-ai-primary-400" />
            </div>
          )}
        </div>

        {/* Video details */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {video.title || "Untitled"}
          </h3>

          {variant === "detailed" && (
            <p className="text-text-secondary mb-4">
              {video.prompt}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <span>{video.duration}s</span>
              <span>•</span>

              <span>•</span>
              <span>{video.creditsCost} credits</span>
              {video.viewCount && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span>{video.viewCount} views</span>
                  </div>
                </>
              )}
            </div>

            {showDownloadButton && video.videoUrl && (
              <Button
                onClick={handleDownload}
                className="bg-gradient-ai text-white hover:shadow-ai"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 