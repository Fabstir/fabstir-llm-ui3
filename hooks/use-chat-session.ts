"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types/chat";
import { ParsedHost } from "@/types/host";
import { IS_MOCK_MODE } from "@/lib/constants";
import { useS5Storage } from "@/hooks/use-s5-storage";
import { useAnalytics } from "@/lib/analytics";
import {
  messageRateLimiter,
  sessionRateLimiter,
  getUserIdentifier,
} from "@/lib/rate-limit";

// SDK types
type SessionManager = any;
type StorageManager = any;

// Session configuration constants
const SESSION_DEPOSIT = "2.0";
const PRICE_PER_TOKEN = 2000;
const PROOF_INTERVAL = 100;
const SESSION_DURATION = 86400;

interface SessionConfig {
  depositAmount: string;
  pricePerToken: number;
  duration: number;
  proofInterval: number;
  hostUrl: string;
  model: string;
  chainId: number;
}

export function useChatSession(
  sessionManager: SessionManager | null,
  selectedHost: ParsedHost | null,
  paymentManager?: any,
  userAddress?: string,
  storageManager?: StorageManager | null
) {
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isApprovalDone, setIsApprovalDone] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // S5 storage integration
  const { storeConversation, isStorageReady } = useS5Storage(
    storageManager || null,
    sessionId,
    selectedHost
  );

  // Analytics integration
  const analytics = useAnalytics();

  // Mutation: Start session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedHost) throw new Error("No host selected");

      // Rate limit check for session creation
      const identifier = getUserIdentifier(userAddress);
      const rateLimitResult = sessionRateLimiter.check(identifier);
      if (!rateLimitResult.success) {
        const resetIn = Math.ceil((rateLimitResult.reset - Date.now()) / 1000 / 60);
        throw new Error(
          `Rate limit exceeded. Please wait ${resetIn} minutes before creating a new session.`
        );
      }

      // Mock mode: Simulate session start
      if (IS_MOCK_MODE) {
        console.log("Mock: Starting session with host", selectedHost.address);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { sessionId: BigInt(Date.now()), jobId: BigInt(1) };
      }

      // Production mode: Use real SDK
      if (!sessionManager) throw new Error("Session manager not initialized");
      if (!paymentManager) throw new Error("Payment manager not initialized");

      // Get USDC token address from ChainRegistry
      const { ChainRegistry, ChainId } = await import("@fabstir/sdk-core");
      const { parseUnits } = await import("viem");
      const chain = ChainRegistry.getChain(ChainId.BASE_SEPOLIA);

      // Step 1: Check and approve USDC to JobMarketplace (one-time, popup-free with Base Account)
      if (userAddress && !isApprovalDone) {
        console.log("🔍 Checking USDC approval for JobMarketplace...");

        const currentAllowance = await paymentManager.checkAllowance(
          userAddress,
          chain.contracts.jobMarketplace,
          chain.contracts.usdcToken
        );
        const requiredAmount = parseUnits(SESSION_DEPOSIT, 6);

        if (currentAllowance < requiredAmount) {
          console.log("📝 Approving JobMarketplace (popup-free with Base Account)...");
          const approvalAmount = parseUnits("1000000", 6); // Approve 1M USDC (one-time)

          await paymentManager.approveToken(
            chain.contracts.jobMarketplace,
            approvalAmount,
            chain.contracts.usdcToken
          );

          console.log("✅ USDC approval complete!");
          setIsApprovalDone(true);
        } else {
          console.log("✅ USDC approval already exists");
          setIsApprovalDone(true);
        }
      }

      // Step 2: Start session
      const config: any = {
        depositAmount: SESSION_DEPOSIT,
        pricePerToken: Number(PRICE_PER_TOKEN), // Ensure it's a number, not bigint
        duration: SESSION_DURATION,
        proofInterval: PROOF_INTERVAL,
        model: selectedHost.models[0],
        provider: selectedHost.address,
        hostAddress: selectedHost.address,
        endpoint: selectedHost.endpoint,
        paymentToken: chain.contracts.usdcToken,
        useDeposit: false, // Use direct payment with Auto Spend Permissions
        chainId: 84532, // Base Sepolia
      };

      console.log("🚀 Starting session with config:", {
        ...config,
        model: config.model.slice(0, 20) + '...',
      });

      const result = await sessionManager.startSession(config);
      console.log("✅ Session started successfully:", result);
      return result;
    },
    onSuccess: (result) => {
      setSessionId(result.sessionId);
      (window as any).__currentSessionId = result.sessionId;

      // Track session start
      analytics.sessionStarted(
        result.sessionId.toString(),
        selectedHost?.address || "unknown",
        selectedHost?.models[0] || "unknown"
      );

      addMessage(
        "system",
        `✅ Session started! Deposited $${SESSION_DEPOSIT} USDC. You can now chat with ${selectedHost?.models[0]}.`
      );

      toast({
        title: "Session Started",
        description: `Connected to ${selectedHost?.address.slice(0, 10)}...`,
      });
    },
    onError: (error: any) => {
      console.error("❌ Session creation failed:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        data: error.data,
        reason: error.reason,
        transaction: error.transaction,
      });

      let errorMessage = error.message;

      // Extract revert reason if available
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      toast({
        title: "Session Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation: Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      if (!sessionId) {
        throw new Error("No active session");
      }

      // Rate limit check for messages
      const identifier = getUserIdentifier(userAddress);
      const rateLimitResult = messageRateLimiter.check(identifier);
      if (!rateLimitResult.success) {
        const resetIn = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
        throw new Error(
          `Too many messages. Please wait ${resetIn} seconds before sending another message.`
        );
      }

      // Mock mode: Simulate AI response
      if (IS_MOCK_MODE) {
        console.log("Mock: Sending message", prompt);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockResponse = `I received your message: "${prompt}"\n\nThis is a simulated AI response in mock mode. In production, this would be a real response from the LLM running on ${selectedHost?.address}.`;

        return { response: mockResponse, prompt };
      }

      // Production mode: Use real SDK
      if (!sessionManager) throw new Error("Session manager not initialized");

      const context = buildContext();
      const fullPrompt = context
        ? `${context}\nUser: ${prompt}\nAssistant:`
        : `User: ${prompt}\nAssistant:`;

      const response = await sessionManager.sendPromptStreaming(
        sessionId,
        fullPrompt
      );

      return { response, prompt };
    },
    onMutate: (prompt) => {
      // Track message sent
      if (sessionId) {
        analytics.messageSent(sessionId.toString(), prompt.length);
      }

      // Optimistically add user message
      addMessage("user", prompt);
    },
    onSuccess: async (data) => {
      const cleaned = cleanResponse(data.response);
      const tokens = Math.ceil((data.prompt.length + cleaned.length) / 4);

      // Track message received
      if (sessionId) {
        analytics.messageReceived(sessionId.toString(), tokens);
      }

      addMessage("assistant", cleaned, tokens);

      // Auto-save conversation to S5 after each message
      if (isStorageReady && messages.length > 0) {
        const updatedTokens = totalTokens + tokens;
        const updatedCost = totalCost + (tokens * PRICE_PER_TOKEN) / 1000000;
        await storeConversation([...messages], updatedTokens, updatedCost);
      }
    },
    onError: (error: any) => {
      addMessage("system", `❌ Error: ${error.message}`);
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation: End session
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error("No active session");
      }

      // Save conversation before ending session
      if (isStorageReady && messages.length > 0) {
        await storeConversation(messages, totalTokens, totalCost);
      }

      // Mock mode: Simulate session end
      if (IS_MOCK_MODE) {
        console.log("Mock: Ending session");
        await new Promise((resolve) => setTimeout(resolve, 800));
        return;
      }

      // Production mode: Use real SDK
      if (!sessionManager) throw new Error("Session manager not initialized");
      await sessionManager.endSession(sessionId);
    },
    onSuccess: () => {
      // Track session end
      if (sessionId) {
        analytics.sessionEnded(
          sessionId.toString(),
          totalTokens,
          totalCost,
          messages.length
        );
      }

      addMessage(
        "system",
        `✅ Session ended. Total tokens: ${totalTokens}, Total cost: $${totalCost.toFixed(4)}`
      );

      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 2000);

      setSessionId(null);
      (window as any).__currentSessionId = null;

      toast({
        title: "Session Ended Successfully! 🎉",
        description: "Conversation saved to S5. Payments distributed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to End Session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const addMessage = useCallback(
    (role: ChatMessage["role"], content: string, tokens?: number) => {
      const message: ChatMessage = {
        role,
        content,
        timestamp: Date.now(),
        tokens,
      };

      setMessages((prev) => [...prev, message]);

      if (tokens) {
        setTotalTokens((prev) => prev + tokens);
        setTotalCost((prev) => prev + (tokens * PRICE_PER_TOKEN) / 1000000);
      }
    },
    []
  );

  const buildContext = useCallback((): string => {
    const previousMessages = messages.filter((m) => m.role !== "system");
    if (previousMessages.length === 0) return "";

    return previousMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
  }, [messages]);

  const cleanResponse = useCallback((response: string): string => {
    let cleaned = response.replace(/^A:\s*/, "").trim();
    if (cleaned.includes("A:")) {
      const parts = cleaned.split(/A:\s*/);
      cleaned = parts[1]?.split("\n")[0]?.trim() || cleaned;
    }
    return cleaned;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTotalTokens(0);
    setTotalCost(0);
  }, []);

  return {
    messages,
    sessionId,
    totalTokens,
    totalCost,
    isSessionActive: sessionId !== null,
    startSession: startSessionMutation.mutate,
    isStartingSession: startSessionMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
    endSession: endSessionMutation.mutate,
    isEndingSession: endSessionMutation.isPending,
    clearMessages,
    showSuccessAnimation,
  };
}
