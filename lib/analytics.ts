"use client";

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  hostAddress: string;
  model: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private sessionData: Map<string, SessionAnalytics> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      // Check environment variable first, then default to production mode
      const envEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
      if (envEnabled !== undefined) {
        this.enabled = envEnabled === 'true';
      } else {
        // Default: enabled in production, disabled in development
        this.enabled = !window.location.hostname.includes("localhost");
      }
    }
  }

  // Track generic events
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      console.log("[Analytics]", eventName, properties);
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Send to analytics service (implement based on your provider)
    this.sendToProvider(event);
  }

  // Track page views
  pageView(path: string, title?: string) {
    this.track("page_view", { path, title });
  }

  // Track wallet connections
  walletConnected(address: string, connector: string) {
    this.track("wallet_connected", {
      address: address.slice(0, 10) + "...",
      connector,
    });
  }

  // Track session lifecycle
  sessionStarted(sessionId: string, hostAddress: string, model: string) {
    const analytics: SessionAnalytics = {
      sessionId,
      startTime: Date.now(),
      totalMessages: 0,
      totalTokens: 0,
      totalCost: 0,
      hostAddress,
      model,
    };

    this.sessionData.set(sessionId, analytics);
    this.track("session_started", {
      sessionId,
      hostAddress: hostAddress.slice(0, 10) + "...",
      model,
    });
  }

  sessionEnded(
    sessionId: string,
    totalTokens: number,
    totalCost: number,
    messageCount: number
  ) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      session.totalMessages = messageCount;
      session.totalTokens = totalTokens;
      session.totalCost = totalCost;

      const duration = session.endTime - session.startTime;

      this.track("session_ended", {
        sessionId,
        duration,
        totalMessages: messageCount,
        totalTokens,
        totalCost,
        model: session.model,
      });

      // Store session data for historical analysis
      this.storeSessionHistory(session);
    }
  }

  // Track messages
  messageSent(sessionId: string, messageLength: number) {
    this.track("message_sent", {
      sessionId,
      messageLength,
    });
  }

  messageReceived(sessionId: string, tokens: number) {
    this.track("message_received", {
      sessionId,
      tokens,
    });
  }

  // Track errors
  error(errorName: string, errorMessage: string, context?: Record<string, any>) {
    this.track("error", {
      errorName,
      errorMessage,
      ...context,
    });
  }

  // Track user settings events
  modelSelected(modelId: string, source: 'setup' | 'header' | 'selector') {
    this.track("model_selected", {
      modelId,
      source,
    });
  }

  hostAutoSelected(modelId: string) {
    this.track("host_auto_selected", {
      modelId,
      // No wallet addresses or PII
    });
  }

  themeChanged(theme: 'light' | 'dark' | 'auto') {
    this.track("theme_changed", {
      theme,
    });
  }

  settingsReset() {
    this.track("settings_reset", {
      timestamp: Date.now(),
    });
  }

  setupCompleted(model: string, theme: 'light' | 'dark' | 'auto', paymentToken: 'USDC' | 'ETH') {
    this.track("setup_completed", {
      model,
      theme,
      paymentToken,
    });
  }

  // Private methods
  private sendToProvider(event: AnalyticsEvent) {
    // Implement analytics provider integration here
    // Examples: Google Analytics, Mixpanel, Plausible, PostHog

    // For now, just store locally
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fabstir_analytics_events");
      const events = stored ? JSON.parse(stored) : [];
      events.push(event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }

      localStorage.setItem("fabstir_analytics_events", JSON.stringify(events));
    }
  }

  private storeSessionHistory(session: SessionAnalytics) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fabstir_session_history");
      const history = stored ? JSON.parse(stored) : [];
      history.push(session);

      // Keep only last 50 sessions
      if (history.length > 50) {
        history.shift();
      }

      localStorage.setItem("fabstir_session_history", JSON.stringify(history));
    }
  }

  // Get analytics data
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getSessionHistory(): SessionAnalytics[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem("fabstir_session_history");
    return stored ? JSON.parse(stored) : [];
  }

  // Clear data
  clearEvents() {
    this.events = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("fabstir_analytics_events");
    }
  }

  clearSessionHistory() {
    this.sessionData.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("fabstir_session_history");
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    pageView: analytics.pageView.bind(analytics),
    walletConnected: analytics.walletConnected.bind(analytics),
    sessionStarted: analytics.sessionStarted.bind(analytics),
    sessionEnded: analytics.sessionEnded.bind(analytics),
    messageSent: analytics.messageSent.bind(analytics),
    messageReceived: analytics.messageReceived.bind(analytics),
    error: analytics.error.bind(analytics),
    // User settings events
    modelSelected: analytics.modelSelected.bind(analytics),
    hostAutoSelected: analytics.hostAutoSelected.bind(analytics),
    themeChanged: analytics.themeChanged.bind(analytics),
    settingsReset: analytics.settingsReset.bind(analytics),
    setupCompleted: analytics.setupCompleted.bind(analytics),
    // Data access
    getEvents: analytics.getEvents.bind(analytics),
    getSessionHistory: analytics.getSessionHistory.bind(analytics),
  };
}
