"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Download, X, Trash2 } from "lucide-react";
import { Video } from "lucide-react";

interface VideoModalProps {
  video: Doc<"videos"> | null;
  onClose: () => void;
  showDownloadButton?: boolean;
  showDeleteButton?: boolean;
  onDownload?: (video: Doc<"videos">) => void;
  onDelete?: (video: Doc<"videos">) => void;
  variant?: "compact" | "detailed";
}

export function VideoModal({
  video,
  onClose,
  showDownloadButton = false,
  showDeleteButton = false,
  onDownload,
  onDelete,
  variant = "detailed"
}: VideoModalProps) {
  if (!video) return null;

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(video);
    } else if (video.videoUrl) {
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

      } catch (error) {
        console.error("Download failed:", error);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(video);
      onClose(); // Close modal after delete
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-5xl w-full max-h-[90vh] bg-gray-950 border border-gray-800/50 rounded-xl overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video player */}
        <div className="aspect-video bg-black">
          {video.videoUrl ? (
            <video
              className="w-full h-full object-contain"
              controls
              autoPlay
              preload="metadata"
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <Video className="h-16 w-16 text-gray-600" />
            </div>
          )}
        </div>

        {/* Video details */}
        <div className="p-6 bg-gray-950/95">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {variant === "detailed" && video.prompt && (
                <p className="text-gray-300 mb-4 text-lg">
                  {video.prompt}
                </p>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                  {video.duration}s
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                  {video.quality}
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">
                  {video.creditsCost} credits
                </span>
                <span className="text-gray-600">
                  {formatDate(video._creationTime)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showDeleteButton && (
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {showDownloadButton && video.videoUrl && (
                <Button
                  onClick={handleDownload}
                  className="bg-white hover:bg-gray-100 text-gray-900 font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 