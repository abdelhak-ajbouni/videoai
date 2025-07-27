"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Brain,
  Zap,
  Eye,
  Heart,
  Star,
  TrendingUp,
  Users,
  CreditCard,
  Video
} from "lucide-react";

export function CardShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-ai mb-2">
          Glass-Morphism Card System
        </h2>
        <p className="text-text-secondary">
          Modern cards with backdrop blur, AI theming, and smooth interactions
        </p>
      </div>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Default Card */}
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-ai-primary-100 dark:bg-ai-primary-900/30">
                <Video className="h-5 w-5 text-ai-primary-600 dark:text-ai-primary-400" />
              </div>
              <CardTitle className="text-lg">Default Card</CardTitle>
            </div>
            <CardDescription>
              Standard card with surface background and subtle shadows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Perfect for general content and information display.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </CardFooter>
        </Card>

        {/* Glass Card */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Eye className="h-5 w-5 text-ai-primary-600 dark:text-ai-primary-400" />
              </div>
              <CardTitle className="text-lg">Glass Card</CardTitle>
            </div>
            <CardDescription>
              Glass-morphism effect with backdrop blur and transparency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Creates depth and modern aesthetic with subtle transparency.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ai-gradient" size="sm">
              Explore
            </Button>
          </CardFooter>
        </Card>

        {/* Glass Elevated Card */}
        <Card variant="glass-elevated">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-white/30 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-ai-electric-600 dark:text-ai-electric-400" />
              </div>
              <CardTitle className="text-lg">Glass Elevated</CardTitle>
            </div>
            <CardDescription>
              Enhanced glass effect with stronger elevation and glow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Premium glass effect for highlighting important content.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ai-gradient" size="sm">
              Premium
            </Button>
          </CardFooter>
        </Card>

        {/* AI Gradient Card */}
        <Card variant="ai-gradient">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-white/20">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg text-white">AI Gradient</CardTitle>
            </div>
            <CardDescription className="text-white/80">
              Stunning gradient background perfect for AI-themed content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70">
              Eye-catching gradient that embodies the AI aesthetic.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
              Generate
            </Button>
          </CardFooter>
        </Card>

        {/* Neural Card */}
        <Card variant="neural">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                <TrendingUp className="h-5 w-5 text-ai-neural-600 dark:text-ai-neural-400" />
              </div>
              <CardTitle className="text-lg">Neural Network</CardTitle>
            </div>
            <CardDescription>
              Cyan-themed card representing neural connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Perfect for analytics, data visualization, and AI insights.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="border-ai-neural-300 text-ai-neural-600 hover:bg-ai-neural-50">
              Analyze
            </Button>
          </CardFooter>
        </Card>

        {/* Electric Card */}
        <Card variant="electric">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-ai-electric-100 dark:bg-ai-electric-900/30">
                <Zap className="h-5 w-5 text-ai-electric-600 dark:text-ai-electric-400" />
              </div>
              <CardTitle className="text-lg">Electric Theme</CardTitle>
            </div>
            <CardDescription>
              Purple-themed card for energy and excitement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Great for highlighting features, promotions, and dynamic content.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="border-ai-electric-300 text-ai-electric-600 hover:bg-ai-electric-50">
              Energize
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Elevation Showcase */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-text-primary">Card Elevations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((elevation) => (
            <Card key={elevation} variant="glass" elevation={elevation}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base capitalize">{elevation}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-text-secondary">
                  Shadow: {elevation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hoverable Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-text-primary">Interactive Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" hoverable>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Hoverable</CardTitle>
              </div>
              <CardDescription>
                Hover me to see the lift and scale effect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Interactive cards provide immediate visual feedback.
              </p>
            </CardContent>
          </Card>

          <Card variant="neural" hoverable>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-ai-neural-600" />
                <CardTitle className="text-lg">Interactive</CardTitle>
              </div>
              <CardDescription>
                Smooth animations on hover and focus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Perfect for clickable content and navigation cards.
              </p>
            </CardContent>
          </Card>

          <Card variant="electric" hoverable>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-ai-electric-600" />
                <CardTitle className="text-lg">Engaging</CardTitle>
              </div>
              <CardDescription>
                Combines visual appeal with smooth interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Great for feature highlights and call-to-action sections.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards Demo */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-text-primary">Stats Cards Example</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="glass" className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-ai-primary-100 dark:bg-ai-primary-900/30">
                  <CreditCard className="h-6 w-6 text-ai-primary-600 dark:text-ai-primary-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-ai-primary-600 dark:text-ai-primary-400 animate-pulse-ai">1,247</p>
              <p className="text-sm text-text-secondary mt-1">Credits Available</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-ai-electric-100 dark:bg-ai-electric-900/30">
                  <Video className="h-6 w-6 text-ai-electric-600 dark:text-ai-electric-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-ai-electric-600 dark:text-ai-electric-400">23</p>
              <p className="text-sm text-text-secondary mt-1">Videos Created</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-ai-neural-100 dark:bg-ai-neural-900/30">
                  <TrendingUp className="h-6 w-6 text-ai-neural-600 dark:text-ai-neural-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-ai-neural-600 dark:text-ai-neural-400">98.5%</p>
              <p className="text-sm text-text-secondary mt-1">Success Rate</p>
            </CardContent>
          </Card>

          <Card variant="ai-gradient" className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 rounded-full bg-white/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">Pro</p>
              <p className="text-sm text-white/80 mt-1">Current Plan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}