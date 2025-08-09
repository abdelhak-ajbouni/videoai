"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserMenu } from "./user-menu";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();

  // Don't show header on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className={cn(
      "h-16 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50",
      className
    )}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Logo */}
        <Link href="/generate" className="flex items-center space-x-1 group">
          <div className="w-8 h-8 rounded-xl shadow-lg group-hover:shadow-lg transition-all duration-300 overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="Veymo.ai logo" 
              width={32} 
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors">Veymo.ai</span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Credit Balance & Subscription */}
          {currentUser && (
            <div className="flex items-center space-x-2">
              {/* Mobile Credit Display */}
              <div className="sm:hidden">
                <Link href="/pricing">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800/80 border border-gray-700/50 transition-all duration-200 cursor-pointer group">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                      {currentUser.credits?.toLocaleString() || '0'}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Desktop Credit Display */}
              <div className="hidden sm:flex items-center space-x-1">
                {/* Credits */}
                <Link href="/pricing">
                  <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-900 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-300 transition-colors"></div>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                        {currentUser.credits?.toLocaleString() || '0'}
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">credits</span>
                    </div>
                  </div>
                </Link>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-700/50"></div>

                {/* Subscription */}
                <Link href="/pricing">
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-900 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-200 cursor-pointer group">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors capitalize">
                      {currentUser.subscriptionTier || 'Free'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-emerald-300 transition-colors"></div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}