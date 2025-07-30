"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  Settings
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();

  // Don't show header on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className={cn(
      "h-16 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50",
      className
    )}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">VideoAI</span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Credit Balance */}
          {currentUser && (
            <Link href="/dashboard/billing">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-950/50 border border-blue-800 hover:bg-blue-950/70 transition-colors duration-200 cursor-pointer">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <div className="text-right">
                  <p className="text-xs text-blue-300">Credits</p>
                  <p className="text-sm font-semibold text-blue-400">
                    {currentUser.credits}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-2 py-1.5 h-auto hover:bg-gray-800"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user.firstName}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-48 bg-gray-950 border border-gray-800"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}