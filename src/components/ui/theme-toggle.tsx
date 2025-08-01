"use client";

import { Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 px-0 hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
      disabled
    >
      <Moon className="h-4 w-4" />
      <span className="sr-only">Current theme: {theme}</span>
    </Button>
  );
}