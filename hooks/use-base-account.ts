"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { createSDK, connectWallet, getAccountInfo } from "@/lib/base-account";
import { getDefaultPermissionParams } from "@/lib/spend-permissions";
import type { FabstirSDKCore } from "@fabstir/sdk-core";
import { ensureSubAccount, createSubAccountSigner } from "@fabstir/sdk-core";

export interface BaseAccountInfo {
  eoaAddress: string;
  primaryAccount: string;
  subAccount: string;
  isUsingBaseAccount: boolean;
}

/**
 * Hook for Base Account Kit integration with popup-free transactions
 *
 * Key Features:
 * - One-time popup for spend permission approval
 * - Subsequent transactions are popup-free
 * - Uses sub-accounts with auto spend permissions
 * - S5 seed caching to avoid permission prompts
 *
 * Usage:
 * ```tsx
 * const { connectWithBaseAccount, accountInfo, isConnecting } = useBaseAccount();
 *
 * // Connect and authenticate SDK
 * await connectWithBaseAccount(sdk, usdcAddress);
 * ```
 */
// Store SDK reference module-level
let sdkInstance: any = null;

export function useBaseAccount() {
  const { toast } = useToast();
  const [accountInfo, setAccountInfo] = useState<BaseAccountInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect with Base Account Kit and authenticate Fabstir SDK
   * This triggers ONE popup for initial spend permission approval
   */
  const connectWithBaseAccount = useCallback(
    async (sdk: FabstirSDKCore, usdcAddress: string, chainId: number = 84532) => {
      setIsConnecting(true);
      setError(null);

      try {
        // Step 1: Create Base Account SDK
        const baseAccountSDK = createSDK();

        // Step 2: Connect wallet (ONE popup for Base Account Kit)
        toast({
          title: "Connecting Base Account",
          description: "Please approve the connection in the popup...",
        });

        const accounts = await connectWallet();

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned from Base Account Kit");
        }

        const walletAddress = accounts[0]!;
        const accountInfo = await getAccountInfo(walletAddress);
        const smartWallet = accountInfo.smartAccount || walletAddress;

        toast({
          title: "Connected",
          description: `Smart wallet: ${smartWallet.slice(0, 6)}...${smartWallet.slice(-4)}`,
        });

        // Step 3: Get or create sub-account with spend permissions
        toast({
          title: "Setting up sub-account",
          description: "This may require approval for spend permissions...",
        });

        const permissionParams = getDefaultPermissionParams({
          token: usdcAddress as `0x${string}`,
          depositAmount: "2.00", // Default deposit amount
        });

        // Set environment variable for SDK (needed for ensureSubAccount)
        if (typeof process !== 'undefined' && process.env) {
          process.env.BASE_CONTRACT_SPEND_PERMISSION_MANAGER = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad';
        }

        const subAccountResult = await ensureSubAccount(
          baseAccountSDK.getProvider(),
          smartWallet as `0x${string}`,
          {
            tokenAddress: usdcAddress as `0x${string}`,
            tokenDecimals: 6,
            maxAllowance: permissionParams.allowance.toString(),
            periodDays: 365,
          }
        );

        const subAccountAddress = subAccountResult.address;

        // Step 4: Create sub-account signer
        const subAccountSigner = createSubAccountSigner({
          provider: baseAccountSDK.getProvider(),
          subAccount: subAccountAddress,
          primaryAccount: smartWallet,
          chainId,
        });

        // Step 5: Authenticate Fabstir SDK with sub-account signer
        // All future transactions will use wallet_sendCalls (popup-free!)
        await sdk.authenticate("signer", {
          signer: subAccountSigner,
        });

        // Step 6: Wait for SDK and spend permissions to settle (prevent race conditions)
        console.log('[Base Account] Waiting for signer and spend permission settlement...');

        // Wait for:
        // 1. SDK to fully register the signer (AuthManager internal registration)
        // 2. Spend permission to propagate through Base Account Kit infrastructure
        // This prevents "no matching signer" and "Transaction failed to confirm" errors
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify signer is registered (non-throwing check)
        try {
          const authManager = sdk.getAuthManager();
          const registeredSigner = authManager.getSigner(subAccountAddress);

          if (registeredSigner) {
            console.log('[Base Account] ✅ Signer verified and ready');
          }
        } catch (err) {
          // Signer not yet registered, but that's okay - retry logic will handle it
          console.warn('[Base Account] ⚠️ Signer not immediately available, but will retry if needed');
        }

        // Store SDK reference for later use
        sdkInstance = sdk;

        const info: BaseAccountInfo = {
          eoaAddress: walletAddress,
          primaryAccount: smartWallet,
          subAccount: subAccountAddress,
          isUsingBaseAccount: true,
        };

        console.log("🔍 Base Account Setup:");
        console.log("  - EOA (MetaMask/Rainbow):", walletAddress);
        console.log("  - PRIMARY Account (Smart Wallet - holds USDC):", smartWallet);
        console.log("  - SUB Account (Spender - sends transactions):", subAccountAddress);
        console.log("💡 Workflow: Deposit USDC to PRIMARY, SUB-account uses it via spend permissions");

        setAccountInfo(info);

        toast({
          title: "✅ Base Account Ready",
          description: "Subsequent transactions will be popup-free!",
        });

        return info;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to connect Base Account";
        setError(errorMessage);

        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [toast]
  );

  /**
   * Disconnect and reset state
   */
  const disconnect = useCallback(() => {
    setAccountInfo(null);
    setError(null);
  }, []);

  return {
    connectWithBaseAccount,
    disconnect,
    accountInfo,
    isConnecting,
    error,
    isConnected: accountInfo !== null,
    // Expose SDK reference for getting managers
    getSdk: () => sdkInstance,
  };
}
