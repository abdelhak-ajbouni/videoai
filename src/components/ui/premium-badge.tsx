import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  tooltipTitle?: string;
  tooltipDescription?: string;
}

export function PremiumBadge({ 
  className, 
  size = "sm", 
  tooltipTitle = "Max Plan Required",
  tooltipDescription = "Upgrade to Max plan to access this premium feature."
}: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 h-6",
    md: "px-2.5 py-1.5 h-8", 
    lg: "px-3 py-2 h-10"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "inline-flex items-center justify-center bg-purple-500/20 border border-purple-400/30 rounded-full cursor-help",
          sizeClasses[size],
          className
        )}>
          <Crown className={cn(
            "text-purple-300 fill-purple-400",
            iconSizes[size]
          )} />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-center">
        <p className="font-medium mb-1 text-white">{tooltipTitle}</p>
        <p className="text-xs text-gray-300">
          {tooltipDescription}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}