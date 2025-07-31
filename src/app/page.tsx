"use client";

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { PlayCircle, Sparkles, Zap, ArrowRight, Video, Star, Globe } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);
  const router = useRouter();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videos = [
    "/videos/tmp7uoz8hjv.mp4",
    "/videos/tmpi29yh_f0.mp4", 
    "/videos/tmpxsomu815.mp4"
  ];

  // Handle user creation after signup and redirect existing users
  useEffect(() => {
    if (isSignedIn && user && isLoaded) {
      if (currentUser === null) {
        // User is signed in but doesn't exist in our database
        // This handles cases where the webhook might have failed
        const createUserRecord = async () => {
          try {
            await createUser({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress || "",
              name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || undefined,
              imageUrl: user.imageUrl || undefined,
            });
            toast.success("Welcome to VideoAI!");
            router.push("/generate");
          } catch (error) {
            console.error("Error creating user:", error);
            toast.error("Welcome to VideoAI! Please refresh the page if you don't see the generate page.");
          }
        };

        createUserRecord();
      } else if (currentUser) {
        // Existing user - redirect to generate page automatically
        router.push("/generate");
      }
    }
  }, [isSignedIn, user, currentUser, isLoaded, createUser, router]);

  // Video rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }, 5000); // Change video every 5 seconds

    return () => clearInterval(interval);
  }, [videos.length]);

  // Reset video to beginning when it becomes active
  useEffect(() => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      currentVideo.currentTime = 0;
      currentVideo.play().catch(e => console.log('Video play failed:', e));
    }
  }, [currentVideoIndex]);

  // Show loading state while Clerk or Convex data is loading, or redirecting signed-in users
  if (!isLoaded || (isSignedIn && currentUser === undefined) || (isSignedIn && currentUser)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loading text={
          isSignedIn && currentUser ? "Redirecting to generate page..." :
            isSignedIn ? "Setting up your account..." :
              "Loading..."
        } />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10"></div>
        <nav className="relative container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">VideoAI</span>
            </div>
            <div className="flex items-center space-x-4">
              <SignUpButton mode="modal" forceRedirectUrl="/generate">
                <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen">
        {/* Background Videos */}
        <div className="absolute inset-0">
          {videos.map((videoSrc, index) => (
            <video
              key={videoSrc}
              ref={(el) => (videoRefs.current[index] = el)}
              autoPlay
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentVideoIndex ? 'opacity-70' : 'opacity-0'
              }`}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ))}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-950/30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20"></div>
        </div>
        <div className="relative container mx-auto px-6 py-20 lg:py-32 z-10 min-h-screen flex items-center">
          <div className="text-center max-w-4xl mx-auto w-full">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Create stunning videos
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                with AI magic
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-3xl mx-auto">
              Transform your ideas into professional videos in minutes. No camera, no editing skills, no problem.
            </p>

            <div className="flex justify-center items-center mb-16">
              <SignUpButton mode="modal" forceRedirectUrl="/generate">
                <Button size="lg" className="text-lg px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 group">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </SignUpButton>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to create
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Professional video creation made simple with cutting-edge AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:bg-gray-900/50 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
                <Video className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Generation</h3>
              <p className="text-gray-400 leading-relaxed">
                Advanced AI models create high-quality videos from your text descriptions in minutes
              </p>
            </div>

            <div className="text-center p-8 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:bg-gray-900/50 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">
                Generate professional videos in minutes, not hours. Perfect for content creators
              </p>
            </div>

            <div className="text-center p-8 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:bg-gray-900/50 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Ready to Share</h3>
              <p className="text-gray-400 leading-relaxed">
                Download and share your videos anywhere. Multiple formats and quality options
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to create your first video?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of creators using AI to bring their ideas to life
            </p>
            <SignUpButton mode="modal" forceRedirectUrl="/generate">
              <Button size="lg" className="text-lg px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 group">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-gray-400">VideoAI</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center space-x-6 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-conditions" className="hover:text-gray-300 transition-colors">
                Terms & Conditions
              </a>
              <a href="/refund-fraud-policy" className="hover:text-gray-300 transition-colors">
                Refund & Fraud Policy
              </a>
            </div>
            
            <p className="text-gray-500 text-sm">
              &copy; 2024 VideoAI. Transform your ideas into videos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
