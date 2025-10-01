"use client";

import { useState, useCallback } from "react";
import { ChatMessage } from "@/types/chat";

/**
 * Simple chat state management hook for Phase 4
 * In Phase 5, this will be integrated with session management and SDK
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    // Simulate AI response (will be replaced with real SDK call in Phase 5)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `This is a simulated AI response to: "${content}"\n\nIn Phase 5, this will be replaced with real LLM responses from the Fabstir network.`,
        timestamp: Date.now(),
        tokens: Math.floor(Math.random() * 100) + 50, // Mock token count
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: ChatMessage = {
        role: "system",
        content: "Failed to send message. Please try again.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isSending,
    sendMessage,
    clearMessages,
  };
}
