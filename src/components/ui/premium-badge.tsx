import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PremiumBadgeProps {
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  tooltipTitle?: string;
}

export function PremiumBadge({
  className,
  label,
  size = "sm",
  tooltipTitle = "Max Plan Required",
}: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full cursor-help transition-all hover:shadow-lg hover:shadow-purple-500/20",
          sizeClasses[size],
          className
        )}>
          {label}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-center">
        <p className="font-medium mb-1 text-white">{tooltipTitle}</p>
      </TooltipContent>
    </Tooltip>
  );
}