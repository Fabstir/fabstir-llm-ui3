// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWalletClient } from "wagmi";
import { IS_MOCK_MODE, MOCK_WALLET_ADDRESS, RPC_URLS } from "@/lib/constants";
import {
  createSessionManager,
  createHostManager,
  createPaymentManager,
  createStorageManager,
  createTreasuryManager,
  getSDKMode,
  logSDKConfig,
} from "@/lib/sdk/sdk-factory";

// SDK types - these will be imported when SDK is available
type FabstirSDKCore = any;
type SessionManager = any;
type PaymentManager = any;
type HostManager = any;
type StorageManager = any;
type TreasuryManager = any;

// Mock data is now handled by the factory in lib/sdk/sdk-factory.ts

export function useFabstirSDK() {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // SDK State
  const [sdk, setSdk] = useState<FabstirSDKCore | null>(null);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(
    null
  );
  const [paymentManager, setPaymentManager] = useState<PaymentManager | null>(
    null
  );
  const [hostManager, setHostManager] = useState<HostManager | null>(null);
  const [storageManager, setStorageManager] = useState<StorageManager | null>(
    null
  );
  const [treasuryManager, setTreasuryManager] =
    useState<TreasuryManager | null>(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Prevent duplicate authentication attempts
  const authInProgress = useRef(false);

  // Initialize SDK on mount
  useEffect(() => {
    initializeSDK();
  }, []);

  // DON'T auto-authenticate when wallet connects
  // Let the user explicitly click "Connect" in Base Account section
  // This prevents unnecessary popups before Base Account setup
  //
  // useEffect(() => {
  //   if (isConnected && address && walletClient && !isAuthenticated && !authInProgress.current) {
  //     authenticateWithWallet();
  //   }
  // }, [isConnected, address, walletClient, isAuthenticated]);

  const initializeSDK = useCallback(async () => {
    try {
      setIsInitializing(true);

      // Log SDK configuration
      logSDKConfig();

      const mode = getSDKMode();

      // Mock mode: Use factory-created mock managers
      if (mode === 'mock') {
        console.log("🎭 Enhanced Mock Mode: Using factory-created managers");

        // Set mock state immediately
        setUserAddress(MOCK_WALLET_ADDRESS);
        setIsAuthenticated(true);
        setSdk(null); // No SDK in mock mode

        // Create enhanced mock managers using factory
        const mockSessionMgr = await createSessionManager();
        const mockHostMgr = await createHostManager();
        const mockPaymentMgr = await createPaymentManager();
        const mockStorageMgr = await createStorageManager();
        const mockTreasuryMgr = await createTreasuryManager();

        setSessionManager(mockSessionMgr);
        setHostManager(mockHostMgr);
        setPaymentManager(mockPaymentMgr);
        setStorageManager(mockStorageMgr);
        setTreasuryManager(mockTreasuryMgr);

        toast({
          title: "🎭 Demo Mode Active",
          description: "Using demonstration AI responses - Real AI nodes coming soon!",
        });

        setIsInitializing(false);
        return; // EXIT EARLY - no SDK initialization
      }

      // PRODUCTION MODE: Real SDK initialization
      toast({
        title: "🚀 Production Mode",
        description: "SDK will be initialized when wallet connects",
      });

      setIsInitializing(false);
    } catch (error: any) {
      console.error("SDK initialization failed:", error);
      toast({
        title: "Initialization Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsInitializing(false);
    }
  }, [toast]);

  const authenticateWithWallet = useCallback(async () => {
    // Prevent duplicate authentication attempts
    if (authInProgress.current) {
      console.log("[Auth] Authentication already in progress, skipping...");
      return;
    }

    // Mock mode: Fake authentication - no wallet needed
    if (IS_MOCK_MODE) {
      setIsAuthenticated(true);
      setUserAddress(MOCK_WALLET_ADDRESS);
      toast({
        title: "Mock Connected",
        description: `Mock wallet: ${MOCK_WALLET_ADDRESS.slice(
          0,
          6
        )}...${MOCK_WALLET_ADDRESS.slice(-4)}`,
      });
      return;
    }

    // PRODUCTION MODE: Real wallet connection
    if (!address || !walletClient) {
      console.log("No wallet connected");
      return;
    }

    try {
      authInProgress.current = true;
      console.log("Authenticating with wallet:", address);

      // Lazy load SDK when actually needed
      const { FabstirSDKCore, ChainId } = await import(
        "@fabstir/sdk-core"
      );

      // Use environment variables for contract addresses (NOT ChainRegistry - it has old addresses)
      const sdkConfig = {
        mode: "production" as const,
        chainId: ChainId.BASE_SEPOLIA,
        rpcUrl: RPC_URLS.BASE_SEPOLIA,
        contractAddresses: {
          jobMarketplace: process.env.NEXT_PUBLIC_CONTRACT_JOB_MARKETPLACE!,
          nodeRegistry: process.env.NEXT_PUBLIC_CONTRACT_NODE_REGISTRY!,
          proofSystem: process.env.NEXT_PUBLIC_CONTRACT_PROOF_SYSTEM!,
          hostEarnings: process.env.NEXT_PUBLIC_CONTRACT_HOST_EARNINGS!,
          fabToken: process.env.NEXT_PUBLIC_CONTRACT_FAB_TOKEN!,
          usdcToken: process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN!,
          modelRegistry: process.env.NEXT_PUBLIC_CONTRACT_MODEL_REGISTRY!,
        },
        s5Config: {
          portalUrl: process.env.NEXT_PUBLIC_S5_PORTAL_URL,
        },
      };

      console.log('[SDK Init] Using contract addresses from .env.local:', {
        nodeRegistry: sdkConfig.contractAddresses.nodeRegistry,
        jobMarketplace: sdkConfig.contractAddresses.jobMarketplace
      });

      const newSdk = new FabstirSDKCore(sdkConfig);

      // Create ethers signer from wagmi walletClient
      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      // Authenticate with signer (not just address)
      await newSdk.authenticate("signer", { signer });

      const signerAddress = await signer.getAddress();
      setUserAddress(signerAddress);
      setSdk(newSdk);

      // Get real managers from SDK using factory pattern
      setPaymentManager(await createPaymentManager(newSdk));
      setSessionManager(await createSessionManager(newSdk));
      setHostManager(await createHostManager(newSdk));
      setStorageManager(await createStorageManager(newSdk));
      setTreasuryManager(await createTreasuryManager(newSdk));
      setIsAuthenticated(true);

      toast({
        title: "Connected",
        description: `Wallet connected: ${signerAddress.slice(
          0,
          6
        )}...${signerAddress.slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Authentication failed:", error);
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      authInProgress.current = false;
    }
  }, [address, walletClient, toast]);

  return {
    sdk,
    sessionManager,
    paymentManager,
    hostManager,
    storageManager,
    treasuryManager,
    isAuthenticated,
    userAddress,
    isInitializing,
    authenticateWithWallet,
    isMockMode: IS_MOCK_MODE,
  };
}
