// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, Zap, Star } from "lucide-react";

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  message = "Success!",
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  // Auto-complete after duration
  if (onComplete) {
    setTimeout(onComplete, duration);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="text-center space-y-4 animate-scale-in">
        <div className="relative inline-flex">
          {/* Expanding rings */}
          <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-success/10 animate-pulse" />

          {/* Icon */}
          <div className="relative bg-success/10 rounded-full p-6 border-2 border-success/30">
            <CheckCircle2 className="w-16 h-16 text-success animate-bounce-subtle" />
          </div>
        </div>

        <p className="text-lg font-medium text-success">{message}</p>
      </div>
    </div>
  );
}

export function FloatingParticles({ count = 20 }: { count?: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const delay = Math.random() * 5;
        const duration = 3 + Math.random() * 4;
        const left = Math.random() * 100;

        return (
          <div
            key={i}
            className="absolute bottom-0 w-2 h-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-40"
            style={{
              left: `${left}%`,
              animation: `float-up ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function GlowingBorder({
  children,
  className,
  glowColor = "primary",
}: {
  children: ReactNode;
  className?: string;
  glowColor?: "primary" | "secondary" | "accent" | "success";
}) {
  const glowColors = {
    primary: "shadow-primary/50",
    secondary: "shadow-secondary/50",
    accent: "shadow-accent/50",
    success: "shadow-success/50",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden",
        "before:absolute before:inset-0 before:p-[2px]",
        "before:bg-gradient-to-r before:from-primary before:via-secondary before:to-accent",
        "before:rounded-lg before:animate-spin-slow",
        className
      )}
    >
      <div className={cn("relative bg-card rounded-lg shadow-2xl", glowColors[glowColor])}>
        {children}
      </div>
    </div>
  );
}

export function ShimmerText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent",
        "bg-[length:200%_100%] animate-shimmer",
        className
      )}
    >
      {children}
    </span>
  );
}

export function PulsingDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-3 w-3", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
    </span>
  );
}

export function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-secondary/60 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-accent/60 animate-bounce" />
      </div>
      <span className="text-sm">AI is thinking...</span>
    </div>
  );
}
