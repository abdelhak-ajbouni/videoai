"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Video, Calendar, Eye } from "lucide-react";

interface VideoPreviewProps {
  video: Doc<"videos">;
  onClick?: () => void;
  showStatus?: boolean;
  showMetadata?: boolean;
  variant?: "my-videos" | "explore";
  className?: string;
}

export function VideoPreview({
  video,
  onClick,
  showStatus = false,
  showMetadata = true,
  variant = "explore",
  className = ""
}: VideoPreviewProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return null; // Don't show badge for completed videos
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className={`group cursor-pointer break-inside-avoid ${className}`}
      onClick={onClick}
    >
      {/* Video Preview */}
      <div className="relative bg-gray-900 overflow-hidden rounded-lg">
        {video.status === 'completed' && video.videoUrl ? (
          <video
            className="w-full h-auto object-contain"
            muted
            loop
            preload="metadata"
            aria-label={`Video preview: ${video.prompt || 'Generated video'}`}
            onMouseEnter={(e) => {
              e.stopPropagation();
              const videoEl = e.target as HTMLVideoElement;
              videoEl.currentTime = 0;
              videoEl.play().catch(() => {
                // Handle autoplay restrictions
              });
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              const videoEl = e.target as HTMLVideoElement;
              videoEl.pause();
              videoEl.currentTime = 0;
            }}
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="w-full aspect-video flex items-center justify-center">
            <Video className="h-8 w-8 text-gray-600" />
          </div>
        )}

        {/* Status Badge */}
        {showStatus && (
          <div className="absolute top-3 left-3">
            {getStatusBadge(video.status)}
          </div>
        )}


        {/* Duration Badge */}
        {video.status === 'completed' && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 text-sm font-medium bg-black/80 text-white rounded-md">
              {video.duration}s
            </span>
          </div>
        )}
      </div>

      {/* Video Info */}
      {showMetadata && (
        <div className="p-3 space-y-2">
          <p className="text-gray-400 text-sm line-clamp-3">
            {video.prompt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-600">
            {variant === "my-videos" ? (
              <>
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(video._creationTime)}
                </span>
                <span className="text-gray-500">
                  {video.creditsCost} credits
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-500">
                  {video.quality} • {video.duration}s
                </span>
                {video.viewCount && (
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {video.viewCount}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}