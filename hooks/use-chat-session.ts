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
const PROOF_INTERVAL = 100;
const SESSION_DURATION = 86400;

/**
 * Verify endpoint serves the expected host address
 * Attempts to query endpoint for its host information
 *
 * REQUIREMENT: Production nodes must expose a /health endpoint that returns:
 * {
 *   "hostAddress": "0x...",  // or "host_address" or "address"
 *   // ... other health info
 * }
 *
 * This prevents creating jobs for the wrong host, which causes:
 * - Proof submission failures ("Only host can submit proof")
 * - 100% refund to user (host and treasury get nothing)
 */
async function verifyEndpointHost(
  endpoint: string,
  expectedHostAddress: string
): Promise<{ verified: boolean; actualHost?: string; error?: string }> {
  try {
    // Convert ws:// to http:// or wss:// to https://
    const httpEndpoint = endpoint.replace(/^ws/, "http");

    // Try to fetch host info from endpoint
    // Note: This requires the node to expose /health or /info endpoint
    const response = await fetch(`${httpEndpoint}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return { verified: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const actualHost = data.hostAddress || data.host_address || data.address;

    if (!actualHost) {
      return { verified: false, error: "No host address in response" };
    }

    const verified =
      actualHost.toLowerCase() === expectedHostAddress.toLowerCase();

    return { verified, actualHost };
  } catch (error: any) {
    console.warn("⚠️  Could not verify endpoint host:", error.message);
    return { verified: false, error: error.message };
  }
}

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
  storageManager?: StorageManager | null,
  settings?: { preferredPaymentToken?: 'USDC' | 'ETH' } | null
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
    retry: (failureCount, error: any) => {
      // Retry for Base Account race conditions (max 2 retries)
      if (failureCount < 2) {
        // Case 1: Signer not registered yet
        if (error.message?.includes("no matching signer found for account")) {
          console.log(`[Session Start] Retrying due to signer race condition (attempt ${failureCount + 1}/2)...`);
          return true;
        }

        // Case 2: Spend permission not fully settled yet (400 errors from chain proxy)
        if (error.message?.includes("Transaction failed to confirm")) {
          console.log(`[Session Start] Retrying due to spend permission settlement delay (attempt ${failureCount + 1}/2)...`);
          return true;
        }

        // Case 3: Spend permission balance sync delay
        // Base Account Kit's virtual balance hasn't synced to sub-account yet
        if (
          error.message?.toLowerCase().includes("transfer amount exceeds balance") ||
          error.message?.toLowerCase().includes("insufficient balance to perform useroperation")
        ) {
          console.log(`[Session Start] Retrying due to spend permission balance sync delay (attempt ${failureCount + 1}/2)...`);
          return true;
        }
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff: 1s, 2s
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

      // Step 2: Get pricing from selected host based on payment token preference
      const pricePerToken = settings?.preferredPaymentToken === 'ETH'
        ? Number(selectedHost.minPricePerTokenNative)  // Use native pricing for ETH
        : Number(selectedHost.minPricePerTokenStable);  // Use stable pricing for USDC (default)

      console.log(`💰 Using host pricing: ${pricePerToken} (${settings?.preferredPaymentToken || 'USDC'})`);

      // Step 3: Start session
      const config: any = {
        depositAmount: SESSION_DEPOSIT,
        pricePerToken: pricePerToken,  // Use actual host pricing
        duration: SESSION_DURATION,
        proofInterval: PROOF_INTERVAL,
        model: selectedHost.models[0],
        provider: selectedHost.address,
        hostAddress: selectedHost.address,
        endpoint: selectedHost.endpoint,
        paymentToken: settings?.preferredPaymentToken === 'ETH'
          ? undefined  // Omit for native ETH payments
          : chain.contracts.usdcToken,  // Include for USDC payments
        useDeposit: false, // Use direct payment with Auto Spend Permissions
        chainId: 84532, // Base Sepolia
      };

      console.log("🚀 Starting session with host:");
      console.log(`  Host Address: ${selectedHost.address}`);
      console.log(`  Endpoint: ${selectedHost.endpoint}`);
      console.log(`  Model: ${config.model}`);
      console.log(`  Deposit: $${SESSION_DEPOSIT} USDC`);

      // Pre-flight verification: Check if endpoint serves the expected host
      console.log("\n🔍 Verifying endpoint host address...");
      const verification = await verifyEndpointHost(
        selectedHost.endpoint,
        selectedHost.address
      );

      if (verification.verified) {
        console.log("✅ Endpoint verification PASSED");
        console.log(`   Endpoint serves host: ${verification.actualHost}`);
      } else {
        console.warn("⚠️  Endpoint verification FAILED");
        if (verification.actualHost) {
          console.error("🚨 HOST MISMATCH DETECTED!");
          console.error(`   Expected: ${selectedHost.address}`);
          console.error(`   Actual:   ${verification.actualHost}`);
          console.error("   ❌ This will cause proof submission to fail!");
          console.error("   ❌ Host and treasury will not be paid!");
          throw new Error(
            `Host mismatch: Endpoint serves ${verification.actualHost} but job will be created for ${selectedHost.address}. This will cause 100% refund!`
          );
        } else {
          console.warn(`   Could not verify: ${verification.error}`);
          console.warn("   Proceeding anyway, but proof submission may fail if host mismatch exists.");
        }
      }

      const result = await sessionManager.startSession(config);
      console.log("✅ Session created successfully:");
      console.log(`  Session ID: ${result.sessionId}`);
      console.log(`  Job ID: ${result.jobId}`);
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
      let errorTitle = "Session Creation Failed";

      // Extract revert reason if available
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      // Detect spend permission depletion vs insufficient balance
      const isSpendPermissionError =
        error.message?.toLowerCase().includes("transfer amount exceeds balance") ||
        error.message?.toLowerCase().includes("insufficient balance to perform useroperation");

      const isLowBalance =
        error.message?.toLowerCase().includes("insufficient") &&
        !isSpendPermissionError;

      if (isSpendPermissionError) {
        errorTitle = "Spend Permission Allowance Depleted";
        errorMessage =
          "Your Base Account sub-account's spend permission has been used up from previous sessions. " +
          "Even after clearing browser data, the same sub-account is reused. " +
          "\n\n**To fix:** Open Coinbase Wallet → Settings → Connected Sites → Disconnect this app → Reconnect. " +
          "This will create a fresh sub-account with renewed allowance.";

        console.error("🚨 SPEND PERMISSION DEPLETED");
        console.error("   Sub-account:", userAddress);
        console.error("   Cause: Base Account Kit reuses existing sub-accounts even after browser data cleared");
        console.error("   Solution: Disconnect app from Coinbase Wallet settings and reconnect");
      } else if (isLowBalance) {
        errorTitle = "Insufficient Balance";
        errorMessage =
          "Not enough USDC to start session ($2.00 required). " +
          "Please deposit USDC to your PRIMARY account.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show longer for spend permission errors
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

        // Use actual host pricing
        const pricePerToken = selectedHost?.minPricePerTokenStable
          ? Number(selectedHost.minPricePerTokenStable)
          : 316;  // Fallback to 0.000316 USDC/token

        const updatedCost = totalCost + (tokens * pricePerToken) / 1000000;
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

        // Use actual pricing from selected host
        const pricePerToken = selectedHost?.minPricePerTokenStable
          ? Number(selectedHost.minPricePerTokenStable)
          : 316;  // Fallback to 0.000316 USDC/token

        setTotalCost((prev) => prev + (tokens * pricePerToken) / 1000000);
      }
    },
    [selectedHost]  // Add selectedHost to dependencies
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
