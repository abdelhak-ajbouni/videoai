"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User,
  CreditCard,
  ChevronDown,
  LogOut,
  Mail
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function UserMenu() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-3 px-3 py-2 h-auto hover:bg-gray-800/50 transition-all duration-200 group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-gray-800 group-hover:ring-gray-700 transition-all duration-200">
            <span className="text-white text-sm font-semibold">
              {user.firstName?.[0] || "U"}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
              {user.firstName}
            </p>
          </div>
          <ChevronDown className="h-3 w-3 text-gray-500 group-hover:text-gray-400 transition-colors" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 bg-gray-950/95 backdrop-blur-xl border border-gray-800/50 shadow-2xl"
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
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/pricing" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Pricing</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href="mailto:support@veymo.ai?subject=Support Request&body=Hello Veymo.ai Support Team,%0D%0A%0D%0A" className="cursor-pointer">
            <Mail className="mr-2 h-4 w-4" />
            <span>Contact Us</span>
          </a>
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
  );
}