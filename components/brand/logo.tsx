"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "with-text" | "icon-only";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 96, height: 96 },
};

export function Logo({
  variant = "default",
  size = "md",
  className,
  animated = false,
}: LogoProps) {
  const dimensions = sizeMap[size];

  if (variant === "with-text") {
    return (
      <div
        className={cn(
          "flex items-center gap-3",
          animated && "animate-fade-in",
          className
        )}
      >
        <Image
          src="/logo-with-text.png"
          alt="Fabstir Logo"
          width={dimensions.width * 3}
          height={dimensions.height}
          className={cn(animated && "hover:scale-105 transition-transform")}
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        animated && "animate-fade-in group",
        className
      )}
    >
      <Image
        src="/logo.svg"
        alt="Fabstir"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          "object-contain",
          animated && "group-hover:scale-110 transition-transform duration-300"
        )}
        priority
      />
      {animated && (
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
}

export function LogoWithGradient({ size = "lg", className }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent blur-2xl opacity-30 animate-pulse" />
      <Logo size={size} animated className="relative z-10" />
    </div>
  );
}
