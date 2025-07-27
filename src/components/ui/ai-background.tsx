"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIBackgroundProps {
  variant?: "neural" | "particles" | "waves" | "grid";
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function AIBackground({
  variant = "neural",
  intensity = "medium",
  className
}: AIBackgroundProps) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getIntensityConfig = () => {
    switch (intensity) {
      case "low":
        return { nodeCount: 15, particleCount: 30, opacity: 0.1 };
      case "high":
        return { nodeCount: 40, particleCount: 100, opacity: 0.4 };
      default:
        return { nodeCount: 25, particleCount: 60, opacity: 0.2 };
    }
  };

  const config = getIntensityConfig();

  if (variant === "neural") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {/* Neural Network Nodes */}
        <div className="absolute inset-0">
          {Array.from({ length: config.nodeCount }).map((_, i) => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 3;

            return (
              <div key={`node-${i}`} className="absolute">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-slow",
                    animationPhase === 0 ? "bg-white/30 scale-100" :
                      animationPhase === 1 ? "bg-ai-electric-400/40 scale-110" :
                        animationPhase === 2 ? "bg-ai-neural-400/40 scale-90" :
                          "bg-white/20 scale-105"
                  )}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animationDelay: `${delay}s`,
                  }}
                />

                {/* Connection Lines */}
                {i < config.nodeCount - 1 && (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                      width: `${Math.abs(x - (Math.random() * 100))}%`,
                      height: `${Math.abs(y - (Math.random() * 100))}%`,
                    }}
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="100%"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                      className="animate-pulse"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Data Streams */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`stream-${i}`}
              className="absolute w-px bg-gradient-to-b from-transparent via-white/20 to-transparent animate-pulse"
              style={{
                left: `${10 + i * 12}%`,
                height: "100%",
                animationDelay: `${i * 0.5}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "particles") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {Array.from({ length: config.particleCount }).map((_, i) => {
          const size = Math.random() * 4 + 1;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const duration = Math.random() * 3 + 2;
          const delay = Math.random() * 2;

          return (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full bg-white/20 animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === "waves") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`wave-${i}`}
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at ${20 + i * 20}% ${30 + i * 15}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              animation: `pulse ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {/* Grid Lines */}
        <div className="absolute inset-0">
          {/* Vertical Lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="absolute top-0 bottom-0 w-px bg-white/5 animate-pulse"
              style={{
                left: `${i * 5}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "3s",
              }}
            />
          ))}

          {/* Horizontal Lines */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`h-line-${i}`}
              className="absolute left-0 right-0 h-px bg-white/5 animate-pulse"
              style={{
                top: `${i * 10}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "4s",
              }}
            />
          ))}
        </div>

        {/* Grid Intersections */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`intersection-${i}`}
            className="absolute w-2 h-2 rounded-full bg-white/20 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: "2s",
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}