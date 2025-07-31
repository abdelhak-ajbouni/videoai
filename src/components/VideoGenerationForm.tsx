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
    <div className="space-y-4">
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-medium text-white/95">
          Create New Video
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Generate AI-powered videos from your description
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt */}
            <div className="space-y-3">
              <Label htmlFor="prompt" className="text-sm font-medium text-white/90">
                Video Description
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video in detail... Be specific about scenes, actions, and visual style for best results."
                className="min-h-32 resize-none bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">{prompt.length}/500 characters</span>
                {prompt.length > 450 && (
                  <span className="text-yellow-400">Almost at limit</span>
                )}
              </div>
            </div>

            {/* AI Model Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/90">AI Model</Label>
              <Select value={modelId} onValueChange={(value: string) => setModelId(value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                  <SelectValue placeholder="Select an AI model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                  {activeModels?.map((model) => (
                    <SelectItem key={model.modelId} value={model.modelId} className="focus:bg-gray-800 focus:text-white">
                      <div className="flex items-center space-x-3 py-1">
                        {getModelIcon(model)}
                        <div>
                          <div className="font-medium text-white text-sm">{model.name}</div>
                          <div className="text-xs text-gray-400 line-clamp-1">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading && (
                <p className="text-sm text-gray-500">Loading available models...</p>
              )}
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quality */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/90">Quality</Label>
                <Select value={quality} onValueChange={(value: "standard" | "high" | "ultra") => setQuality(value)}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                    <SelectItem value="standard" className="focus:bg-gray-800 focus:text-white">
                      <div className="flex items-center justify-between w-full">
                        <span>Standard</span>
                        <Badge variant="secondary" className="ml-2">720p</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="high" disabled={!canAccessQuality("high")} className="focus:bg-gray-800 focus:text-white">
                      <div className="flex items-center justify-between w-full">
                        <span>High</span>
                        <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">1080p</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="ultra" disabled={!canAccessQuality("ultra")} className="focus:bg-gray-800 focus:text-white">
                      <div className="flex items-center justify-between w-full">
                        <span>Ultra</span>
                        <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">4K</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/90">Duration</Label>
                <Select value={duration.toString()} onValueChange={(value: string) => setDuration(parseInt(value))}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                    {getValidDurations(currentModel).map((item) => (
                      <SelectItem key={item.value} value={item.value.toString()} className="focus:bg-gray-800 focus:text-white">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{item.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium h-12"
              disabled={!prompt.trim() || !modelId || !hasEnoughCredits || isGenerating || !canAccessQuality(quality) || isLoading}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <div className="flex items-center justify-center w-full relative">
                  <div className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Video
                  </div>
                  {creditsCost > 0 && (
                    <div className="absolute right-0 flex items-center space-x-1 text-sm opacity-80">
                      <span>{creditsCost}</span>
                      <span>credits</span>
                    </div>
                  )}
                </div>
              )}
            </Button>

            {/* Error Messages */}
            {!hasEnoughCredits && (
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Insufficient credits</p>
                  <p className="text-xs text-red-300/80 mt-1">You need {creditsCost} credits but only have {currentUser?.credits || 0}. Upgrade your plan to get more credits.</p>
                </div>
              </div>
            )}

            {!canAccessQuality(quality) && (
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Quality tier not available</p>
                  <p className="text-xs text-yellow-300/80 mt-1">Your current plan doesn't support {quality} quality. Upgrade to access higher quality tiers.</p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="hidden lg:block bg-gray-900/30 backdrop-blur-sm border-gray-800/50">
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
              <span>Include camera movements like "close-up", "wide shot", or "tracking shot"</span>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
              <span>Mention lighting and mood to enhance the atmosphere</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 