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
      "relative overflow-hidden rounded-2xl",
      "min-h-[400px] flex items-center",
      className
    )}>
      {/* AI Background Animation */}
      <AIBackground variant="neural" intensity="medium" />

      {/* Additional Floating Icons with Green Accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <Brain className="h-8 w-8 text-emerald-300/40" />
        </div>
        <div className="absolute top-32 right-32 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <Cpu className="h-6 w-6 text-green-300/35" />
        </div>
        <div className="absolute bottom-24 left-32 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
          <Network className="h-7 w-7 text-emerald-200/45" />
        </div>
        <div className="absolute bottom-32 right-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>
          <Zap className="h-5 w-5 text-green-300/40" />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}>
          <TrendingUp className="h-6 w-6 text-emerald-300/35" />
        </div>

        {/* Enhanced Gradient Overlay with Green */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 via-transparent to-green-800/20" />
      </div>

      {/* Content */}
      <Container className="relative z-10">
        <div className="max-w-4xl">
          <div className="space-y-6">
            {/* Greeting */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-400/30 backdrop-blur-sm border border-emerald-300/20">
                  <Sparkles className="h-5 w-5 text-emerald-200 animate-pulse" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">
                  {getGreeting()}, {user?.firstName || "Creator"}!
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Welcome to{" "}
                <span className="relative">
                  VideoAI
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-300/60 rounded-full" />
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-emerald-50 font-light max-w-2xl">
                {getMotivationalMessage()}
              </p>
            </div>

            {/* Stats with Green Accents */}
            {currentUser && (
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-400/20 backdrop-blur-sm border border-emerald-300/20">
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-100">{currentUser.credits}</div>
                    <div className="text-sm text-emerald-200/80">Credits Available</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-green-400/20 backdrop-blur-sm border border-green-300/20">
                    <Video className="h-4 w-4 text-green-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-100">{currentUser.totalCreditsUsed}</div>
                    <div className="text-sm text-green-200/80">Videos Created</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-400/20 backdrop-blur-sm border border-emerald-300/20">
                    <Zap className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold capitalize text-emerald-100">{currentUser.subscriptionTier}</div>
                    <div className="text-sm text-emerald-200/80">Current Plan</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions with Improved Button Styling */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-0"
              >
                <Play className="h-5 w-5 mr-2" />
                Generate Your First Video
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-emerald-300/40 text-emerald-100 hover:bg-emerald-400/20 backdrop-blur-sm hover:border-emerald-300/60"
              >
                <Video className="h-5 w-5 mr-2" />
                Explore Gallery
              </Button>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom Fade with Green */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-emerald-900/30 to-transparent" />
    </div>
  );
}