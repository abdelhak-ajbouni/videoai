import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({
  text = "Loading...",
  size = "md",
  className
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className={cn("text-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4",
          sizeClasses[size]
        )}
      />
      <p className="text-gray-600">{text}</p>
    </div>
  );
} 