"use client";

import { analytics } from "./analytics";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

export interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
}

class ErrorMonitoring {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;
  private enabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      // Initialize error monitoring
      this.setupGlobalErrorHandlers();
    }
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled errors
    window.addEventListener("error", (event) => {
      this.captureError(event.error || new Error(event.message), {
        severity: "high",
        context: {
          component: "window",
          action: "unhandled_error",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        {
          severity: "high",
          context: {
            component: "window",
            action: "unhandled_promise_rejection",
          },
        }
      );
    });

    // Catch console errors (optional)
    const originalError = console.error;
    console.error = (...args) => {
      this.captureError(new Error(args.join(" ")), {
        severity: "medium",
        context: {
          component: "console",
          action: "console_error",
        },
      });
      originalError.apply(console, args);
    };
  }

  captureError(
    error: Error,
    options?: {
      severity?: ErrorReport["severity"];
      context?: ErrorContext;
    }
  ) {
    if (!this.enabled) {
      console.error("[Monitoring]", error, options);
      return;
    }

    const report: ErrorReport = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: options?.context,
      timestamp: Date.now(),
      severity: options?.severity || "medium",
    };

    this.errors.push(report);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Send to analytics
    analytics.error(error.name, error.message, options?.context);

    // Send to external service (e.g., Sentry)
    this.sendToService(report);

    // Store in localStorage for debugging
    this.storeError(report);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[Error Monitoring]", report);
    }
  }

  private sendToService(report: ErrorReport) {
    // Implement Sentry or other error tracking service integration here
    // Example with Sentry:
    /*
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(report.message), {
        level: report.severity,
        extra: report.context,
      });
    }
    */
  }

  private storeError(report: ErrorReport) {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("fabstir_error_reports");
      const errors = stored ? JSON.parse(stored) : [];
      errors.push(report);

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift();
      }

      localStorage.setItem("fabstir_error_reports", JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getStoredErrors(): ErrorReport[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem("fabstir_error_reports");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  clearErrors() {
    this.errors = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("fabstir_error_reports");
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Singleton instance
export const errorMonitoring = new ErrorMonitoring();

// React hook for error monitoring
export function useErrorMonitoring() {
  return {
    captureError: (
      error: Error,
      options?: {
        severity?: ErrorReport["severity"];
        context?: ErrorContext;
      }
    ) => errorMonitoring.captureError(error, options),
    getErrors: () => errorMonitoring.getErrors(),
    getStoredErrors: () => errorMonitoring.getStoredErrors(),
    clearErrors: () => errorMonitoring.clearErrors(),
  };
}

// Error boundary helper
export function handleErrorBoundary(
  error: Error,
  errorInfo: React.ErrorInfo,
  context?: ErrorContext
) {
  errorMonitoring.captureError(error, {
    severity: "high",
    context: {
      ...context,
      componentStack: errorInfo.componentStack,
      action: "react_error_boundary",
    },
  });
}
