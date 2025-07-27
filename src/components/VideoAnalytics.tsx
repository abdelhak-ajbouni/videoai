"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Download,
  Clock,
  HardDrive,
  Video,
  Activity,
  PlayCircle
} from "lucide-react";
import { useState } from "react";

export function VideoAnalytics() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year" | "all">("month");

  const analytics = useQuery(api.videos.getVideoAnalytics, { timeRange });
  const userTags = useQuery(api.videos.getUserTags);

  if (analytics === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Video Analytics</h2>
          <p className="text-gray-600 mt-1">
            Insights and performance metrics for your videos
          </p>
        </div>

        <Select value={timeRange} onValueChange={(value: "week" | "month" | "quarter" | "year" | "all") => setTimeRange(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="quarter">Last 90 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedVideos} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Across all videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Total downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(analytics.totalFileSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total file size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Video Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed</span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {analytics.statusBreakdown.completed}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.statusBreakdown.completed / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Processing</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {analytics.statusBreakdown.processing}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.statusBreakdown.processing / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Pending</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {analytics.statusBreakdown.pending}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.statusBreakdown.pending / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Failed</span>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {analytics.statusBreakdown.failed}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.statusBreakdown.failed / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quality Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Standard Quality</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {analytics.qualityBreakdown.standard}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.qualityBreakdown.standard / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">High Quality</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {analytics.qualityBreakdown.high}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.qualityBreakdown.high / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Ultra Quality</span>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-purple-100 text-purple-800">
                  {analytics.qualityBreakdown.ultra}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((analytics.qualityBreakdown.ultra / analytics.totalVideos) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance and Usage Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Processing Time</span>
              <span className="text-sm font-medium">
                {formatDuration(analytics.averageProcessingTime)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Credits Used</span>
              <span className="text-sm font-medium text-blue-600">
                {analytics.totalCreditsUsed} credits
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Success Rate</span>
              <span className="text-sm font-medium text-green-600">
                {Math.round((analytics.completedVideos / Math.max(analytics.totalVideos, 1)) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlayCircle className="h-5 w-5 mr-2" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userTags && userTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userTags.slice(0, 10).map((tagData) => (
                  <Badge
                    key={tagData.tag}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tagData.tag} ({tagData.count})
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No tags found. Add tags to your videos to see them here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 