"use client";

import { useUser, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videos = [
    "/videos/tmp7uoz8hjv.mp4",
    "/videos/tmpi29yh_f0.mp4",
    "/videos/tmpxsomu815.mp4"
  ];

  // Auto-redirect authenticated users to generate page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/generate");
    }
  }, [isLoaded, isSignedIn, router]);

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
      currentVideo.play().catch(() => {
        // Silent error handling for video play
      });
    }
  }, [currentVideoIndex]);

  // Show loading state while authentication is loading or redirecting
  if (!isLoaded || isSignedIn) {
    return (
      <div className=" bg-gray-950 flex items-center justify-center">
        <Loading text={isSignedIn ? "Redirecting to dashboard..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="bg-gray-950">
      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden h-screen" role="banner" aria-label="Hero section">
        {/* Header - Overlay on top */}
        <header className="absolute top-0 left-0 right-0 z-30">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
          <nav className="relative container mx-auto px-6 py-6" role="navigation" aria-label="Main navigation">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg overflow-hidden" role="img" aria-label="Veymo.ai logo">
                  <Image 
                    src="/logo.png" 
                    alt="Veymo.ai logo" 
                    width={24} 
                    height={24}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-lg font-semibold text-white">Veymo.ai</span>
              </div>
              <div className="flex items-center space-x-4">
                <SignUpButton 
                  mode="modal" 
                  forceRedirectUrl="/generate"
                >
                  <Button size="sm" className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white border border-white/20" aria-label="Get started with Veymo.ai">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </div>
          </nav>
        </header>
        {/* Background Videos */}
        <div className="absolute inset-0">
          {videos.map((videoSrc, index) => (
            <video
              key={videoSrc}
              ref={(el) => { videoRefs.current[index] = el; }}
              autoPlay
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentVideoIndex ? 'opacity-70' : 'opacity-0'
                }`}
              aria-hidden="true"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ))}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-950/30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20"></div>
        </div>
        <div className="relative container mx-auto px-6 z-20 h-full flex items-center">
          <article className="text-center mx-auto w-full max-w-6xl">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 mr-2 text-blue-300" />
              AI-Powered Video Creation
            </div>

            {/* Main Headline */}
            <h1 className="hero-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-6 sm:mb-8 leading-tight sm:leading-[0.9] tracking-tight">
              Create stunning videos
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                  with AI magic
                </span>
                {/* Subtle underline decoration */}
                <div className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-pink-400/60 rounded-full transform scale-x-0 animate-scale-x"></div>
              </span>
            </h1>

            {/* Enhanced Subtitle */}
            <div className="max-w-3xl lg:max-w-4xl mx-auto mb-8 sm:mb-12">
              <p className="hero-text text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 font-light leading-relaxed sm:leading-tight">
                Turn any text prompt into
                <span className="text-white font-medium"> high-quality videos </span>
                instantly using advanced AI
              </p>
            </div>

            <div className="flex justify-center items-center mb-12 sm:mb-16">
              <SignUpButton 
                mode="modal" 
                forceRedirectUrl="/generate"
              >
                <Button size="lg" className="bg-white hover:bg-gray-50 text-gray-900 px-10 py-5 text-lg font-medium rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-h-[64px] touch-manipulation" aria-label="Create your first video with AI">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-blue-600 mr-4" />
                    <span className="tracking-wide">Create Your First Video</span>
                    <ArrowRight className="ml-4 h-5 w-5 text-blue-600" />
                  </div>
                </Button>
              </SignUpButton>
            </div>

          </article>
        </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 md:space-y-0 md:flex-row md:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-gray-400 font-medium">Veymo.ai</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-300 transition-colors touch-manipulation">
                Privacy Policy
              </a>
              <a href="/terms-conditions" className="hover:text-gray-300 transition-colors touch-manipulation">
                Terms & Conditions
              </a>
            </div>

            <p className="text-gray-500 text-sm text-center md:text-left">
              &copy; 2024 Veymo.ai. Transform your ideas into videos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
