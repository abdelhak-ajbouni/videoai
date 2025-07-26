"use client";

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlayCircle, Sparkles, Zap } from "lucide-react";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  if (isSignedIn && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to create amazing videos with AI?
            </p>
            <div className="space-y-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-3">
                  Go to Dashboard
                </Button>
              </Link>
              <div className="text-sm text-gray-500">
                Credits remaining: {currentUser.credits}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <PlayCircle className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Videos with{" "}
            <span className="text-blue-600">AI Magic</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Transform your ideas into stunning videos using cutting-edge AI technology.
            No filming, no editing skills required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <SignUpButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Creating Free
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </SignInButton>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6">
              <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">
                Advanced AI creates high-quality videos from your text descriptions
              </p>
            </div>
            <div className="text-center p-6">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Generate professional videos in minutes, not hours
              </p>
            </div>
            <div className="text-center p-6">
              <PlayCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Share</h3>
              <p className="text-gray-600">
                Download and share your videos anywhere, anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 VideoAI. Transform your ideas into videos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
