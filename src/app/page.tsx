"use client";

import { useUser, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Sparkles, Zap, ArrowRight, Video, Globe } from "lucide-react";
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
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center" role="img" aria-label="Veymo.ai logo">
                  <Sparkles className="h-3 w-3 text-white" />
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
                <Button size="lg" className="relative group overflow-hidden bg-gradient-to-r from-white via-gray-50 to-white text-gray-900 hover:from-gray-50 hover:via-white hover:to-gray-50 px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl border-2 border-white/20 shadow-2xl hover:shadow-white/30 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 min-h-[56px] sm:min-h-auto touch-manipulation" aria-label="Create your first video with AI">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <div className="relative flex items-center">
                    <div className="relative mr-4">
                      <Sparkles className="h-6 w-6 text-blue-600 group-hover:text-purple-600 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                      {/* Pulsing ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 group-hover:border-purple-400/50 animate-pulse"></div>
                    </div>

                    <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
                      Create Your First Video
                    </span>

                    <ArrowRight className="ml-4 h-6 w-6 text-blue-600 group-hover:text-purple-600 group-hover:translate-x-2 transition-all duration-300" />
                  </div>

                  {/* Bottom glow */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-pink-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                </Button>
              </SignUpButton>
            </div>

          </article>
        </div>
        </section>
      </main>

      {/* Features */}
      <section className="py-16 sm:py-20 lg:py-32" aria-labelledby="features-heading">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Everything you need to create
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Professional video creation made simple with cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto" role="list">
            <article className="text-center p-6 sm:p-8 bg-gray-900 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800/50 hover:bg-gray-800/50 transition-all duration-300" role="listitem">
              <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6" role="img" aria-label="AI Generation icon">
                <Video className="h-6 sm:h-8 w-6 sm:w-8 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">AI Generation</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Advanced AI models create high-quality videos from your text descriptions in minutes
              </p>
            </article>

            <article className="text-center p-6 sm:p-8 bg-gray-900 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800/50 hover:bg-gray-800/50 transition-all duration-300" role="listitem">
              <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6" role="img" aria-label="Lightning Fast icon">
                <Zap className="h-6 sm:h-8 w-6 sm:w-8 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Generate professional videos in minutes, not hours. Perfect for content creators
              </p>
            </article>

            <article className="text-center p-6 sm:p-8 bg-gray-900 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800/50 hover:bg-gray-800/50 transition-all duration-300 sm:col-span-2 lg:col-span-1" role="listitem">
              <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6" role="img" aria-label="Ready to Share icon">
                <Globe className="h-6 sm:h-8 w-6 sm:w-8 text-green-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Ready to Share</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Download and share your videos anywhere. Multiple formats and quality options
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Ready to create your first video?
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8">
              Join thousands of creators using AI to bring their ideas to life
            </p>
            <SignUpButton 
              mode="modal" 
              forceRedirectUrl="/generate"
            >
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 hover:bg-gray-100 group min-h-[52px] touch-manipulation">
                <Sparkles className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Start Creating Now
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignUpButton>
          </div>
        </div>
      </section>

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
              <a href="/refund-fraud-policy" className="hover:text-gray-300 transition-colors touch-manipulation">
                Refund & Fraud Policy
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
