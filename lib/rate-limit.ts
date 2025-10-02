"use client";

export interface RateLimitConfig {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private cache: Map<string, { count: number; resetTime: number }> = new Map();
  private uniqueTokenPerInterval: number;
  private interval: number;

  constructor(config: RateLimitConfig = {}) {
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval || 10;
    this.interval = config.interval || 60 * 1000; // 1 minute default
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const tokenData = this.cache.get(identifier);

    // First request or reset period passed
    if (!tokenData || now > tokenData.resetTime) {
      const resetTime = now + this.interval;
      this.cache.set(identifier, { count: 1, resetTime });

      return {
        success: true,
        limit: this.uniqueTokenPerInterval,
        remaining: this.uniqueTokenPerInterval - 1,
        reset: resetTime,
      };
    }

    // Increment counter
    tokenData.count++;

    // Check if limit exceeded
    if (tokenData.count > this.uniqueTokenPerInterval) {
      return {
        success: false,
        limit: this.uniqueTokenPerInterval,
        remaining: 0,
        reset: tokenData.resetTime,
      };
    }

    // Update cache
    this.cache.set(identifier, tokenData);

    return {
      success: true,
      limit: this.uniqueTokenPerInterval,
      remaining: this.uniqueTokenPerInterval - tokenData.count,
      reset: tokenData.resetTime,
    };
  }

  reset(identifier: string) {
    this.cache.delete(identifier);
  }

  clearAll() {
    this.cache.clear();
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different actions
export const messageRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 20, // 20 messages
  interval: 60 * 1000, // per minute
});

export const sessionRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 5, // 5 sessions
  interval: 60 * 60 * 1000, // per hour
});

export const hostDiscoveryRateLimiter = new RateLimiter({
  uniqueTokenPerInterval: 10, // 10 discoveries
  interval: 60 * 1000, // per minute
});

// Cleanup old entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    messageRateLimiter.cleanup();
    sessionRateLimiter.cleanup();
    hostDiscoveryRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

// React hook for rate limiting
export function useRateLimit(
  limiter: RateLimiter,
  identifier: string
): {
  check: () => RateLimitResult;
  reset: () => void;
} {
  return {
    check: () => limiter.check(identifier),
    reset: () => limiter.reset(identifier),
  };
}

// Helper to generate identifier from user address
export function getUserIdentifier(address?: string): string {
  if (!address) {
    // Fallback to browser fingerprint (simple version)
    return `anonymous_${navigator.userAgent.slice(0, 20)}`;
  }
  return address.toLowerCase();
}
