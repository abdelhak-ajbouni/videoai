"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Clock,
  Settings,
  Coins,
  AlertCircle,
  Loader2,
  Video,
  Info,
  Crown,
  Zap,
  Wand2,
  Target,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { Doc } from "../../convex/_generated/dataModel";

export function VideoGenerationForm() {
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState<string>("");
  const [quality, setQuality] = useState<"standard" | "high" | "ultra">("standard");
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createVideo = useMutation(api.videos.createVideo);
  const activeModels = useQuery(api.models.getActiveModels);

  const creditCost = useQuery(api.pricing.getCreditCost, {
    modelId: modelId || "",
    quality,
    duration
  });

  const creditsCost = creditCost || 0;
  const hasEnoughCredits = currentUser ? currentUser.credits >= creditsCost : false;

  // Check if data is still loading
  const isLoading = !activeModels;

  // Set default model when available, or use first available model as fallback
  useEffect(() => {
    if (!modelId && activeModels && activeModels.length > 0) {
      // Try to find the default model first
      const defaultModelFromList = activeModels.find(model => model.isDefault);
      if (defaultModelFromList) {
        setModelId(defaultModelFromList.modelId);
      } else {
        // Fallback to first available model
        setModelId(activeModels[0].modelId);
      }
    }
  }, [activeModels, modelId]);

  // Get current model information
  const currentModel = activeModels?.find(m => m.modelId === modelId);

  // Check if user can access quality tiers based on subscription
  const canAccessQuality = (qualityTier: string) => {
    if (!currentUser) return false;

    switch (qualityTier) {
      case "standard":
        return true; // Available to all
      case "high":
        return ["starter", "pro", "business"].includes(currentUser.subscriptionTier);
      case "ultra":
        return ["business"].includes(currentUser.subscriptionTier);
      default:
        return false;
    }
  };

  // Get valid durations for the selected model
  const getValidDurations = (model: Doc<"models"> | undefined) => {
    if (!model) return [];

    if (model.fixedDuration) {
      return [{ value: model.fixedDuration, label: `${model.fixedDuration} seconds`, badge: "Fixed duration" }];
    } else {
      return model.supportedDurations.map((d: number) => ({
        value: d,
        label: `${d} seconds`,
        badge: d === Math.min(...model.supportedDurations) ? "Base cost" : `${d}s option`
      }));
    }
  };

  // Update duration when model changes
  useEffect(() => {
    if (currentModel) {
      if (currentModel.fixedDuration) {
        setDuration(currentModel.fixedDuration);
      } else if (!currentModel.supportedDurations.includes(duration)) {
        setDuration(Math.min(...currentModel.supportedDurations));
      }
    }
  }, [currentModel, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please enter a video description");
      return;
    }

    if (!modelId) {
      toast.error("Please select a model");
      return;
    }

    if (!hasEnoughCredits) {
      toast.error("Insufficient credits to generate this video");
      return;
    }

    if (!canAccessQuality(quality)) {
      toast.error("Your subscription plan doesn't support this quality tier");
      return;
    }

    setIsGenerating(true);

    try {
      await createVideo({
        prompt: prompt.trim(),
        model: modelId,
        quality,
        duration: duration.toString(),
      });

      toast.success("Video generation started! Check your library to see progress.");

      // Reset form
      setPrompt("");
      // Reset to first available model or empty string
      setModelId(activeModels && activeModels.length > 0 ? activeModels[0].modelId : "");
      setQuality("standard");
      setDuration(5);

    } catch (error) {
      console.error("Error creating video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start video generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const getQualityBadge = (qualityTier: string, available: boolean) => {
    if (!available) {
      return <Badge variant="secondary" className="opacity-50">Upgrade Required</Badge>;
    }

    switch (qualityTier) {
      case "standard":
        return <Badge variant="secondary">720p</Badge>;
      case "high":
        return <Badge className="bg-blue-100 text-blue-800">1080p HD</Badge>;
      case "ultra":
        return <Badge className="bg-purple-100 text-purple-800">4K Ultra</Badge>;
      default:
        return <Badge variant="secondary">{qualityTier}</Badge>;
    }
  };

  const getModelIcon = (model: Doc<"models">) => {
    if (model.isPremium) return <Crown className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />;
    if (model.isFast) return <Zap className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />;
    if (model.isDefault) return <Star className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Main Form */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Wand2 className="h-5 w-5 text-purple-500" />
            <span>Create New Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* AI Model Selection - Moved to top */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Model</Label>
              <Select value={modelId} onValueChange={(value: string) => setModelId(value)}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 h-14 text-base">
                  <SelectValue placeholder="Select an AI model" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl min-w-[400px]">
                  {activeModels?.map((model) => (
                    <SelectItem key={model.modelId} value={model.modelId} className="py-4">
                      <div className="flex items-start space-x-4 w-full">
                        {getModelIcon(model)}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{model.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading available models...</p>
              )}
            </div>



            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-medium">Video Description</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video in detail..."
                className="min-h-24 resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{prompt.length}/500</p>
            </div>

            <Separator />

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
              </div>

              {/* Quality and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Quality</Label>
                  <Select value={quality} onValueChange={(value: "standard" | "high" | "ultra") => setQuality(value)}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 h-14 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl">
                      <SelectItem value="standard" className="py-3">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-900 dark:text-white text-base">Standard</span>
                          {getQualityBadge("standard", canAccessQuality("standard"))}
                        </div>
                      </SelectItem>
                      <SelectItem value="high" disabled={!canAccessQuality("high")} className="py-3">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-900 dark:text-white text-base">High</span>
                          {getQualityBadge("high", canAccessQuality("high"))}
                        </div>
                      </SelectItem>
                      <SelectItem value="ultra" disabled={!canAccessQuality("ultra")} className="py-3">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-900 dark:text-white text-base">Ultra</span>
                          {getQualityBadge("ultra", canAccessQuality("ultra"))}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Duration</Label>
                  <Select value={duration.toString()} onValueChange={(value: string) => setDuration(parseInt(value))}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 h-14 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl">
                      {getValidDurations(currentModel).map((item) => (
                        <SelectItem key={item.value} value={item.value.toString()} className="py-3">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-900 dark:text-white text-base">{item.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3"
              disabled={!prompt.trim() || !modelId || !hasEnoughCredits || isGenerating || !canAccessQuality(quality) || isLoading}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                  <span className="ml-2 text-xs opacity-90">({creditsCost} credits)</span>
                </>
              )}
            </Button>

            {/* Credit Warning */}
            {!hasEnoughCredits && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Insufficient credits. Upgrade your plan to get more credits.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Info className="h-4 w-4 text-blue-500" />
            <span>Quick Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-2">
              <Target className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>Be specific about scenes, actions, and visual style</span>
            </div>
            <div className="flex items-start space-x-2">
              <Target className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>Include camera movements like &quot;close-up&quot; or &quot;wide shot&quot;</span>
            </div>
            <div className="flex items-start space-x-2">
              <Target className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>Mention lighting and mood for better results</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 