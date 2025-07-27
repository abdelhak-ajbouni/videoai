"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layouts/container";
import { AIBackground } from "@/components/ui/ai-background";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Video,
  Zap,
  ArrowRight,
  Play,
  Brain,
  Cpu,
  Network,
  TrendingUp
} from "lucide-react";

interface WelcomeHeroProps {
  className?: string;
}

export function WelcomeHero({ className }: WelcomeHeroProps) {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);




  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to create something amazing?",
      "Let's bring your ideas to life with AI",
      "Your next viral video is just a prompt away",
      "Transform your creativity with AI power",
      "Make the impossible possible with AI"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-br from-ai-primary-500 via-ai-electric-500 to-ai-neural-400",
      "min-h-[400px] flex items-center",
      className
    )}>
      {/* AI Background Animation */}
      <AIBackground variant="neural" intensity="medium" />

      {/* Additional Floating Icons */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <Brain className="h-8 w-8 text-white/20" />
        </div>
        <div className="absolute top-32 right-32 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <Cpu className="h-6 w-6 text-white/15" />
        </div>
        <div className="absolute bottom-24 left-32 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
          <Network className="h-7 w-7 text-white/25" />
        </div>
        <div className="absolute bottom-32 right-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>
          <Zap className="h-5 w-5 text-white/20" />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}>
          <TrendingUp className="h-6 w-6 text-white/15" />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />
      </div>

      {/* Content */}
      <Container className="relative z-10">
        <div className="max-w-4xl">
          <div className="space-y-6">
            {/* Greeting */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-white animate-pulse-ai" />
                </div>
                <span className="text-white/80 text-sm font-medium">
                  {getGreeting()}, {user?.firstName || "Creator"}!
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Welcome to{" "}
                <span className="relative">
                  VideoAI
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-white/30 rounded-full" />
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl">
                {getMotivationalMessage()}
              </p>
            </div>

            {/* Stats */}
            {currentUser && (
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{currentUser.credits}</div>
                    <div className="text-sm text-white/70">Credits Available</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{currentUser.totalCreditsUsed}</div>
                    <div className="text-sm text-white/70">Videos Created</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold capitalize">{currentUser.subscriptionTier}</div>
                    <div className="text-sm text-white/70">Current Plan</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-white text-ai-primary-600 hover:bg-white/90 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-normal font-semibold"
              >
                <Play className="h-5 w-5 mr-2" />
                Generate Your First Video
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <Video className="h-5 w-5 mr-2" />
                Explore Gallery
              </Button>
            </div>

            {/* Quick Tips */}
            <div className="pt-6 border-t border-white/20">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                  <span>Try: "A sunset over mountains"</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <span>Or: "Futuristic city at night"</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: '1s' }} />
                  <span>Even: "Dancing robot in space"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}