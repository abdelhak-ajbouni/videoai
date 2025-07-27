import { cn } from "@/lib/utils";
import { Brain, Sparkles, Zap } from "lucide-react";

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "neural" | "pulse" | "dots" | "ai-processing";
  className?: string;
}

export function Loading({
  text = "Loading...",
  size = "md",
  variant = "spinner",
  className
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  if (variant === "neural") {
    return (
      <div className={cn("text-center", className)}>
        <div className="relative mx-auto mb-4" style={{ width: sizeClasses[size].split(' ')[1], height: sizeClasses[size].split(' ')[0] }}>
          {/* Neural Network Animation */}
          <div className="neural-loader">
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-ai-neural-400 rounded-full animate-pulse"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-${size === 'sm' ? '12px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'})`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-ai-primary-500 rounded-full animate-pulse-ai" />
            </div>
          </div>
        </div>
        <p className={cn("text-text-secondary", textSizeClasses[size])}>{text}</p>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("text-center", className)}>
        <div className="relative mx-auto mb-4 flex items-center justify-center" style={{ width: sizeClasses[size].split(' ')[1], height: sizeClasses[size].split(' ')[0] }}>
          <div className="absolute inset-0 rounded-full bg-ai-primary-500 animate-ping opacity-20" />
          <div className="absolute inset-2 rounded-full bg-ai-primary-500 animate-ping opacity-40" style={{ animationDelay: '0.2s' }} />
          <div className="absolute inset-4 rounded-full bg-ai-primary-500 animate-ping opacity-60" style={{ animationDelay: '0.4s' }} />
          <div className="relative w-4 h-4 bg-ai-primary-500 rounded-full" />
        </div>
        <p className={cn("text-text-secondary", textSizeClasses[size])}>{text}</p>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("text-center", className)}>
        <div className="flex justify-center space-x-2 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-ai-primary-500 rounded-full animate-bounce",
                size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p className={cn("text-text-secondary", textSizeClasses[size])}>{text}</p>
      </div>
    );
  }

  if (variant === "ai-processing") {
    return (
      <div className={cn("text-center", className)}>
        <div className="relative mx-auto mb-6" style={{ width: sizeClasses[size].split(' ')[1], height: sizeClasses[size].split(' ')[0] }}>
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-ai-primary-200 dark:border-ai-primary-800" />

          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-ai-primary-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-ai-electric-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-ai-neural-500 animate-spin" style={{ animationDuration: '2s' }} />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className={cn(
              "text-ai-primary-500 animate-pulse-ai",
              size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-10 w-10'
            )} />
          </div>
        </div>
        <p className={cn("text-text-secondary font-medium", textSizeClasses[size])}>{text}</p>
      </div>
    );
  }

  // Default spinner variant with AI theming
  return (
    <div className={cn("text-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-ai-primary-200 border-t-ai-primary-500 mx-auto mb-4 dark:border-ai-primary-800 dark:border-t-ai-primary-400",
          sizeClasses[size]
        )}
      />
      <p className={cn("text-text-secondary", textSizeClasses[size])}>{text}</p>
    </div>
  );
}

// Skeleton Loading Components
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: "pulse" | "shimmer" | "wave";
}

export function Skeleton({
  className,
  width,
  height,
  lines = 1,
  animation = "shimmer",
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const animationClass = {
    pulse: "animate-pulse bg-gray-200 dark:bg-gray-700",
    shimmer: "animate-shimmer",
    wave: "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
  };

  if (lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 rounded-md",
              animationClass[animation],
              i === lines - 1 && "w-3/4" // Last line is shorter
            )}
            style={{
              width: i === lines - 1 ? '75%' : width,
              height: height || '1rem'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md",
        animationClass[animation],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// AI Processing Stages Component
interface AIProcessingProps {
  stages?: string[];
  currentStage?: number;
  className?: string;
}

export function AIProcessing({
  stages = [
    "Analyzing prompt...",
    "Initializing AI model...",
    "Generating frames...",
    "Processing video...",
    "Finalizing..."
  ],
  currentStage = 0,
  className
}: AIProcessingProps) {
  return (
    <div className={cn("text-center space-y-6", className)}>
      {/* Main AI Processing Animation */}
      <div className="relative w-24 h-24 mx-auto">
        {/* Outer pulse rings */}
        <div className="absolute inset-0 rounded-full bg-ai-primary-500 animate-ping opacity-20" />
        <div className="absolute inset-2 rounded-full bg-ai-electric-500 animate-ping opacity-30" style={{ animationDelay: '0.5s' }} />
        <div className="absolute inset-4 rounded-full bg-ai-neural-500 animate-ping opacity-40" style={{ animationDelay: '1s' }} />

        {/* Center brain icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-full bg-gradient-ai">
            <Brain className="h-8 w-8 text-white animate-pulse-ai" />
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {stages.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-normal",
                  index <= currentStage
                    ? "bg-ai-primary-500 animate-pulse"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium text-text-primary">
            {stages[currentStage]}
          </p>
          <div className="w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-ai h-2 rounded-full transition-all duration-slow"
              style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 