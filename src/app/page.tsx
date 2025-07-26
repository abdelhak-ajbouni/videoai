"use client";

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { PlayCircle, Sparkles, Zap } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);
  const router = useRouter();

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
            toast.success("Welcome to VideoAI! You've received 10 free credits.");
            router.push("/dashboard");
          } catch (error) {
            console.error("Error creating user:", error);
            toast.error("Welcome to VideoAI! Please refresh the page if you don't see your dashboard.");
          }
        };

        createUserRecord();
      } else if (currentUser) {
        // Existing user - redirect to dashboard automatically
        router.push("/dashboard");
      }
    }
  }, [isSignedIn, user, currentUser, isLoaded, createUser, router]);

  // Show loading state while Clerk or Convex data is loading, or redirecting signed-in users
  if (!isLoaded || (isSignedIn && currentUser === undefined) || (isSignedIn && currentUser)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loading text={
          isSignedIn && currentUser ? "Redirecting to dashboard..." :
            isSignedIn ? "Setting up your account..." :
              "Loading..."
        } />
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
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/dashboard"
            >
              <Button size="lg" className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating Free
              </Button>
            </SignUpButton>
            <SignInButton
              mode="modal"
              forceRedirectUrl="/dashboard"
            >
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </SignInButton>
          </div>

          {/* Value Proposition */}
          <div className="mb-12 p-6 bg-white/50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-600">Free Starter Credits</span>
            </div>
            <p className="text-gray-700">
              Get <strong>10 free credits</strong> when you sign up — enough to create multiple videos and explore our platform!
            </p>
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
