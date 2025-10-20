// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { ParsedHost } from "@/types/host";

type StorageManager = any;

export interface ConversationMetadata {
  totalTokens: number;
  totalCost: number;
  model: string;
  provider: string;
  timestamp: number;
}

export interface StoredConversation {
  id: string;
  messages: Array<{
    role: ChatMessage["role"];
    content: string;
    timestamp: number;
  }>;
  metadata: ConversationMetadata;
}

export function useS5Storage(
  storageManager: StorageManager | null,
  sessionId: bigint | null,
  selectedHost: ParsedHost | null
) {
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [lastSavedCid, setLastSavedCid] = useState<string | null>(null);

  // Check storage manager initialization
  useEffect(() => {
    if (storageManager && typeof storageManager.isInitialized === "function") {
      setIsStorageReady(storageManager.isInitialized());
    }
  }, [storageManager]);

  // Store conversation in S5
  const storeConversation = useCallback(
    async (messages: ChatMessage[], totalTokens: number, totalCost: number) => {
      if (!storageManager || !sessionId || !isStorageReady) {
        console.warn("Storage not ready:", {
          hasStorageManager: !!storageManager,
          hasSessionId: !!sessionId,
          isStorageReady,
        });
        return null;
      }

      try {
        const conversationData: StoredConversation = {
          id: sessionId.toString(),
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          metadata: {
            totalTokens,
            totalCost,
            model: selectedHost?.models?.[0] || "unknown",
            provider: selectedHost?.address || "unknown",
            timestamp: Date.now(),
          },
        };

        const cid = await storageManager.storeConversation(conversationData);
        setLastSavedCid(cid);
        console.log("✅ Conversation stored to S5:", cid);
        return cid;
      } catch (error) {
        console.error("Failed to store conversation:", error);
        return null;
      }
    },
    [storageManager, sessionId, isStorageReady, selectedHost]
  );

  // Load conversation from S5
  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!storageManager || !isStorageReady) {
        console.warn("Storage not ready for loading");
        return null;
      }

      try {
        const conversation = await storageManager.loadConversation(
          conversationId
        );
        console.log("✅ Conversation loaded from S5:", conversationId);
        return conversation as StoredConversation;
      } catch (error) {
        console.error("Failed to load conversation:", error);
        return null;
      }
    },
    [storageManager, isStorageReady]
  );

  // List all conversations for the current user
  const listConversations = useCallback(async () => {
    if (!storageManager || !isStorageReady) {
      console.warn("Storage not ready for listing");
      return [];
    }

    try {
      const conversations = await storageManager.listConversations();
      return conversations;
    } catch (error) {
      console.error("Failed to list conversations:", error);
      return [];
    }
  }, [storageManager, isStorageReady]);

  return {
    storeConversation,
    loadConversation,
    listConversations,
    isStorageReady,
    lastSavedCid,
  };
}
