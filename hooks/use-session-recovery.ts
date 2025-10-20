// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { ParsedHost } from "@/types/host";

export interface RecoverableSession {
  sessionId: string;
  messages: ChatMessage[];
  selectedHost: ParsedHost;
  totalTokens: number;
  totalCost: number;
  timestamp: number;
}

const SESSION_STORAGE_KEY = "fabstir_active_session";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useSessionRecovery() {
  const [recoveredSession, setRecoveredSession] =
    useState<RecoverableSession | null>(null);

  // Check for recoverable session on mount
  useEffect(() => {
    checkForRecoverableSession();
  }, []);

  const checkForRecoverableSession = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return;

      const session: RecoverableSession = JSON.parse(stored);

      // Check if session is still valid (not expired)
      const isExpired = Date.now() - session.timestamp > SESSION_TTL;
      if (isExpired) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      // Convert BigInt fields back if present
      if (session.selectedHost) {
        if (typeof session.selectedHost.stake === 'string') {
          session.selectedHost.stake = BigInt(session.selectedHost.stake);
        }
        if (typeof (session.selectedHost as any).minPricePerTokenNative === 'string') {
          (session.selectedHost as any).minPricePerTokenNative = BigInt((session.selectedHost as any).minPricePerTokenNative);
        }
        if (typeof (session.selectedHost as any).minPricePerTokenStable === 'string') {
          (session.selectedHost as any).minPricePerTokenStable = BigInt((session.selectedHost as any).minPricePerTokenStable);
        }
      }

      setRecoveredSession(session);
    } catch (error) {
      console.error("Failed to recover session:", error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const saveSession = useCallback(
    (
      sessionId: bigint,
      messages: ChatMessage[],
      selectedHost: ParsedHost | null,
      totalTokens: number,
      totalCost: number
    ) => {
      if (typeof window === "undefined" || !selectedHost) return;

      try {
        const session: RecoverableSession = {
          sessionId: sessionId.toString(),
          messages,
          selectedHost: selectedHost ? {
            ...selectedHost,
            stake: selectedHost.stake.toString(), // Convert BigInt to string for serialization
            minPricePerTokenNative: selectedHost.minPricePerTokenNative.toString(),
            minPricePerTokenStable: selectedHost.minPricePerTokenStable.toString(),
          } as any as ParsedHost : selectedHost,  // Type assertion for serialization
          totalTokens,
          totalCost,
          timestamp: Date.now(),
        };

        // Custom JSON serializer that handles BigInt
        const serialized = JSON.stringify(session, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        );

        localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    },
    []
  );

  const clearSession = useCallback(() => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(SESSION_STORAGE_KEY);
    setRecoveredSession(null);
  }, []);

  const dismissRecovery = useCallback(() => {
    setRecoveredSession(null);
  }, []);

  return {
    recoveredSession,
    saveSession,
    clearSession,
    dismissRecovery,
    hasRecoverableSession: recoveredSession !== null,
  };
}

// Auto-save session state periodically
export function useAutoSaveSession(
  sessionId: bigint | null,
  messages: ChatMessage[],
  selectedHost: ParsedHost | null,
  totalTokens: number,
  totalCost: number
) {
  const { saveSession } = useSessionRecovery();

  useEffect(() => {
    if (!sessionId) return;

    // Save immediately when session starts
    saveSession(sessionId, messages, selectedHost, totalTokens, totalCost);

    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      saveSession(sessionId, messages, selectedHost, totalTokens, totalCost);
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [sessionId, messages, selectedHost, totalTokens, totalCost, saveSession]);
}
