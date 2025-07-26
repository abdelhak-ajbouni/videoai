"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VideoGenerationForm } from "@/components/VideoGenerationForm";
import { VideoLibrary } from "@/components/VideoLibrary";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Video, Plus } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [activeTab, setActiveTab] = useState("generate");

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Create amazing videos with AI
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Credits</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentUser.credits}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("generate")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "generate"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Generate Video
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "library"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Video className="h-4 w-4 inline mr-2" />
              My Videos
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "generate" && (
          <div className="max-w-4xl mx-auto">
            <VideoGenerationForm />
          </div>
        )}

        {activeTab === "library" && (
          <div className="max-w-7xl mx-auto">
            <VideoLibrary />
          </div>
        )}
      </div>
    </div>
  );
} 