"use client";

import { Logo, LogoWithGradient } from "./logo";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  variant?: "default" | "minimal" | "gradient";
  className?: string;
}

export function LoadingScreen({
  message = "Loading...",
  variant = "default",
  className,
}: LoadingScreenProps) {
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-screen bg-background",
          className
        )}
      >
        <div className="text-center space-y-4">
          <Logo size="lg" animated />
          <div className="space-y-2">
            <div className="flex gap-1 justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5",
          className
        )}
      >
        <div className="text-center space-y-6 animate-fade-in">
          <LogoWithGradient size="xl" />
          <div className="space-y-3">
            <p className="text-lg font-medium text-foreground">{message}</p>
            <div className="w-48 h-1 bg-border rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen bg-background",
        className
      )}
    >
      <div className="text-center space-y-6 animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-glow" />
          <Logo size="xl" animated className="relative z-10" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Fabstir
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-secondary animate-spin" />
    </div>
  );
}
