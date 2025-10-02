"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types/chat";
import { ParsedHost } from "@/types/host";
import { IS_MOCK_MODE } from "@/lib/constants";

// SDK types
type SessionManager = any;

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
  userAddress?: string
) {
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isApprovalDone, setIsApprovalDone] = useState(false);

  // Mutation: Start session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedHost) throw new Error("No host selected");

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
        pricePerToken: PRICE_PER_TOKEN,
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

      const result = await sessionManager.startSession(config);
      return result;
    },
    onSuccess: (result) => {
      setSessionId(result.sessionId);
      (window as any).__currentSessionId = result.sessionId;

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
      toast({
        title: "Session Creation Failed",
        description: error.message,
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
      // Optimistically add user message
      addMessage("user", prompt);
    },
    onSuccess: (data) => {
      const cleaned = cleanResponse(data.response);
      const tokens = Math.ceil((data.prompt.length + cleaned.length) / 4);

      addMessage("assistant", cleaned, tokens);
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
      addMessage(
        "system",
        `✅ Session ended. Total tokens: ${totalTokens}, Total cost: $${totalCost.toFixed(4)}`
      );
      setSessionId(null);
      (window as any).__currentSessionId = null;

      toast({
        title: "Session Ended",
        description: "Payments have been distributed",
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
  };
}
