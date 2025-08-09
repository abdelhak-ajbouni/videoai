"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PremiumBadge } from "@/components/ui/premium-badge";
import {
  Sparkles,
  Clock,
  AlertCircle,
  Loader2,
  Video,
  Target,
  Repeat,
  Info,
  Bot
} from "lucide-react";
import { toast } from "sonner";
import { Doc } from "../../convex/_generated/dataModel";

interface VideoGenerationFormProps {
  onVideoCreated?: (videoId: string) => void;
}

export function VideoGenerationForm({ onVideoCreated }: VideoGenerationFormProps) {
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState<string>("");
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Model-specific options
  const [resolution, setResolution] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [loop, setLoop] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<string>("");
  const [cameraFixed, setCameraFixed] = useState<boolean>(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createVideo = useMutation(api.videos.createVideo);
  const activeModels = useQuery(api.models.getActiveModels);

  // Get model parameters for the current model
  const modelParameters = useQuery(
    api.modelParameterHelpers.getModelParametersForForm,
    modelId ? { modelId } : "skip"
  );

  const creditCost = useQuery(
    api.pricing.getCreditCost,
    modelId && resolution && duration && resolution !== "" ? {
      modelId,
      duration,
      resolution
    } : "skip"
  );

  const creditsCost = creditCost || 0;
  const hasEnoughCredits = currentUser ? currentUser.credits >= creditsCost : false;

  // Check if data is still loading - only show loading for essential data
  const isLoading = !activeModels || (modelId && !modelParameters);

  // Set default model when available, or use first available model as fallback
  useEffect(() => {
    if (!modelId && activeModels && activeModels.length > 0) {
      // Try to find the default model first
      const defaultModelFromList = activeModels.find((model: Doc<"models">) => model.isDefault);
      if (defaultModelFromList) {
        setModelId(defaultModelFromList.modelId);
      } else {
        // Fallback to first available model
        setModelId(activeModels[0].modelId);
      }
    }
  }, [activeModels, modelId]);

  // Get current model information (now includes capabilities)
  const currentModel = activeModels?.find((m: Doc<"models">) => m.modelId === modelId);

  // Get valid durations for the selected model
  const getValidDurations = (model: Doc<"models"> | undefined) => {
    if (!model) return [];

    if (modelParameters?.supportedDurations && modelParameters.supportedDurations.length > 0) {
      // Use data from modelParameters table
      const durations = modelParameters.supportedDurations;
      return durations.map((d: number) => ({
        value: d,
        label: `${d}s`,
        badge: d === Math.min(...durations) ? "Base cost" : `${d}s option`
      }));
    } else {
      // Fallback for when model parameters are still loading - use a reasonable default
      return [{ value: 5, label: "5 seconds", badge: "Default" }];
    }
  };

  // Set defaults when model or model parameters change
  useEffect(() => {
    if (modelParameters && !isLoading) {
      // Set duration default
      if (modelParameters.defaultValues.duration) {
        setDuration(modelParameters.defaultValues.duration);
      }

      // Set resolution default
      if (modelParameters.defaultValues.resolution) {
        setResolution(modelParameters.defaultValues.resolution);
      }

      // Set aspect ratio default
      if (modelParameters.defaultValues.aspectRatio) {
        setAspectRatio(modelParameters.defaultValues.aspectRatio);
      }

      // Set camera position default
      if (modelParameters.defaultValues.cameraPosition) {
        setCameraPosition(modelParameters.defaultValues.cameraPosition);
      }

      // Set camera fixed default
      if (modelParameters.defaultValues.cameraFixed !== undefined) {
        setCameraFixed(modelParameters.defaultValues.cameraFixed);
      } else {
        setCameraFixed(false);
      }

      // Set loop default
      if (modelParameters.defaultValues.loop !== undefined) {
        setLoop(modelParameters.defaultValues.loop);
      } else {
        setLoop(false);
      }


    }
  }, [modelParameters, isLoading, modelId]);

  // Reset model-specific parameters when model changes to prevent incompatible combinations
  useEffect(() => {
    if (modelId) {
      setResolution("");
      setAspectRatio("");
      setLoop(false);
      setCameraPosition("");
      setCameraFixed(false);
    }
  }, [modelId]);

  // Set default visibility based on subscription tier
  useEffect(() => {
    if (currentUser) {
      // Max plan users get private videos by default, others get public
      const isPublicByDefault = currentUser.subscriptionTier !== "max";
      setIsPublic(isPublicByDefault);
    }
  }, [currentUser]);

  // Filter resolutions based on subscription tier
  const getAvailableResolutions = (resolutions: string[]) => {
    if (!currentUser || !resolutions) return [];

    const userTier = currentUser.subscriptionTier || "free";

    // Only Pro and Max users can access 1080p
    if (userTier === "free" || userTier === "starter") {
      return resolutions.filter(res => res !== "1080p");
    }

    return resolutions;
  };

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

    setIsGenerating(true);

    try {
      const videoId = await createVideo({
        prompt: prompt.trim(),
        model: modelId,
        quality: "standard",
        duration: duration.toString(),
        generationSettings: {
          resolution: resolution || undefined,
          aspectRatio: aspectRatio || undefined,
          loop: loop || undefined,
          cameraFixed: cameraFixed || undefined,
          cameraPosition: cameraPosition || undefined,
        },
        isPublic,
      });

      // Notify parent component about the created video
      if (onVideoCreated && videoId) {
        onVideoCreated(videoId);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start video generation");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card className="bg-gray-900 backdrop-blur-sm border-gray-800/50">
          <CardHeader className="pb-6 hidden sm:block">
            <CardTitle className="text-lg font-medium text-white/95">
              Create New Video
            </CardTitle>
            <p className="text-sm text-gray-400">
              Generate AI-powered videos from your description
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4 sm:mt-0">
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
                  className="min-h-32 resize-none bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-0 focus:outline-none"
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
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-0 focus:outline-none h-12 sm:h-14">
                    <div className="flex items-center space-x-4">
                      <Bot className="h-6 w-6 text-blue-400" />
                      <SelectValue placeholder="Select an AI model" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                    {activeModels?.map((model: Doc<"models">) => (
                      <SelectItem key={model.modelId} value={model.modelId} className="focus:bg-gray-800 focus:text-white">
                        <div className="text-left py-1">
                          <div className={`text-sm text-left ${modelId === model.modelId ? 'font-medium text-blue-400' : 'font-medium text-white'}`}>{model.name}</div>
                          <div className="text-xs text-gray-400 line-clamp-1 text-left">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoading && (
                  <p className="text-sm text-gray-500">Loading model options...</p>
                )}
              </div>


              {/* Model-Specific Options */}
              {currentModel && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Duration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white/90">Duration</Label>
                    <Select value={duration.toString()} onValueChange={(value: string) => setDuration(parseInt(value))}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-0 focus:outline-none h-11 sm:h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                        {getValidDurations(currentModel).map((item: { value: number; label: string; badge: string }) => (
                          <SelectItem key={item.value} value={item.value.toString()} className="focus:bg-gray-800 focus:text-white">
                            <div className="flex items-center space-x-2">
                              <Clock className={`h-4 w-4 ${duration === item.value ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className={duration === item.value ? 'font-medium text-blue-400' : ''}>{item.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Resolution (when supported by model) */}
                  {modelParameters?.supportedResolutions && modelParameters.supportedResolutions.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white/90">
                        Resolution
                      </Label>
                      <Select value={resolution} onValueChange={(value: string) => value && setResolution(value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-0 focus:outline-none h-11 sm:h-12">
                          <SelectValue placeholder="Select resolution" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                          {getAvailableResolutions(modelParameters.supportedResolutions).map((res) => (
                            <SelectItem key={res} value={res} className="focus:bg-gray-800 focus:text-white">
                              <div className="flex items-center space-x-2">
                                <Video className={`h-4 w-4 ${resolution === res ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className={resolution === res ? 'font-medium text-blue-400' : ''}>{res}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {/* Show 1080p as disabled for lower tiers */}
                          {(currentUser?.subscriptionTier === "free" || currentUser?.subscriptionTier === "starter") &&
                            modelParameters.supportedResolutions.includes("1080p") && (
                              <SelectItem value="1080p" disabled className="focus:bg-gray-800 focus:text-white opacity-50">
                                <div className="flex items-center space-x-2">
                                  <Video className="h-4 w-4 text-gray-400" />
                                  <span>1080p</span>
                                  <PremiumBadge
                                    size="sm"
                                    className="ml-1"
                                    label="Pro"
                                    tooltipTitle="Pro Plan Required"
                                  />
                                </div>
                              </SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Aspect Ratio (when supported by model) */}
                  {modelParameters?.supportedAspectRatios && modelParameters.supportedAspectRatios.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white/90">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={(value: string) => value && setAspectRatio(value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-0 focus:outline-none h-11 sm:h-12">
                          <SelectValue placeholder="select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                          {modelParameters.supportedAspectRatios.map((ratio: string) => (
                            <SelectItem key={ratio} value={ratio} className="focus:bg-gray-800 focus:text-white">
                              <div className="flex items-center space-x-2">
                                <Target className={`h-4 w-4 ${aspectRatio === ratio ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className={aspectRatio === ratio ? 'font-medium text-blue-400' : ''}>{ratio}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}



                  {/* Camera Position (when supported by model) */}
                  {modelParameters?.supportedCameraPositions && modelParameters.supportedCameraPositions.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white/90">Camera Position</Label>
                      <Select value={cameraPosition} onValueChange={(value: string) => value && setCameraPosition(value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-0 focus:outline-none h-11 sm:h-12">
                          <SelectValue placeholder="Select camera position" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                          {modelParameters.supportedCameraPositions.map((position: string) => (
                            <SelectItem key={position} value={position} className="focus:bg-gray-800 focus:text-white">
                              <div className="flex items-center space-x-2">
                                <Video className={`h-4 w-4 ${cameraPosition === position ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className={`capitalize ${cameraPosition === position ? 'font-medium text-blue-400' : ''}`}>
                                  {position}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Camera Fixed Option (when supported by model) */}
                  {modelParameters?.supportsCameraFixed && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white/90">Camera</Label>
                      <div
                        className="group relative p-3 rounded-lg bg-gray-800/30 border border-gray-600 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer h-11 sm:h-12 flex items-center"
                        onClick={() => setCameraFixed(!cameraFixed)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="relative">
                            <input
                              id="cameraFixed"
                              type="checkbox"
                              checked={cameraFixed}
                              onChange={(e) => setCameraFixed(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${cameraFixed
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                              }`}>
                              {cameraFixed && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-1">
                            
                            <span className="text-sm text-blue-400">
                              Fixed position
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loop Option (when supported by model) */}
                  {modelParameters?.supportsLoop && (
                    <div className="space-y-3 sm:col-span-2">
                      <Label className="text-sm font-medium text-white/90">Loop Video</Label>
                      <div
                        className="group relative p-3 rounded-lg bg-gray-800/30 border border-gray-600 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer h-11 sm:h-12 flex items-center"
                        onClick={() => setLoop(!loop)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className="relative">
                            <input
                              id="loop"
                              type="checkbox"
                              checked={loop}
                              onChange={(e) => setLoop(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${loop
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                              }`}>
                              {loop && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-1">
                            <Repeat className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                            <span className="text-sm text-white/90">
                              Create looping video
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Public Visibility Option */}
              <div className="space-y-3">
                <div
                  className={`group relative h-11 sm:h-12 flex items-center p-3 rounded-lg bg-gray-800/30 border border-gray-600 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer`}
                  onClick={() => {
                    if (currentUser?.subscriptionTier === "max") {
                      setIsPublic(!isPublic);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`relative ${currentUser?.subscriptionTier !== "max" && "cursor-not-allowed"}`}>
                      <input
                        id="isPublic"
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => {
                          if (currentUser?.subscriptionTier === "max") {
                            setIsPublic(e.target.checked);
                          }
                        }}
                        disabled={currentUser?.subscriptionTier !== "max"}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${isPublic
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                        }`}>
                        {isPublic && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-sm text-white/90">
                        Public video
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors cursor-help">
                            <Info className="h-4 w-4 text-gray-300 hover:text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64 text-center">
                          <p className="font-medium mb-1 text-white">Public Videos</p>
                          <p className="text-xs text-gray-300">
                            Public videos appear in the explore page.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      {currentUser?.subscriptionTier !== "max" && (
                        <PremiumBadge
                          label="Max"
                          size="sm"
                          tooltipTitle="Max Plan Required"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>


              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
                disabled={!prompt.trim() || !modelId || !hasEnoughCredits || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <div className="flex items-center justify-center text-sm w-full relative">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Video  ({creditsCost} credits)
                  </div>
                )}
              </Button>

              {/* Error Messages */}
              {!hasEnoughCredits && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-400">Need more credits</p>
                      <p className="text-xs text-red-300/80 mt-1">
                        You need {creditsCost} credits but only have {currentUser?.credits || 0}.
                        {currentUser?.subscriptionTier && currentUser.subscriptionTier !== "free" ? (
                          " Purchase additional credits."
                        ) : (
                          " Upgrade your plan to get credits."
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Call-to-action button for subscribers */}
                  <div className="mx-4 mt-1">
                    <Button
                      onClick={() => window.location.href = '/pricing'}
                      size="sm"
                      className="underline text-white text-xs px-3 py-1.5 h-auto"
                    >
                      Buy More Credits
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}