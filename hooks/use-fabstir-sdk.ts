"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWalletClient } from "wagmi";
import { IS_MOCK_MODE, MOCK_WALLET_ADDRESS, RPC_URLS } from "@/lib/constants";

// SDK types - these will be imported when SDK is available
type FabstirSDKCore = any;
type SessionManager = any;
type PaymentManager = any;
type HostManager = any;
type StorageManager = any;
type TreasuryManager = any;

// Mock data for UI development
const MOCK_HOSTS = [
  {
    address: "0x123...abc",
    metadata: {
      hardware: { gpu: "RTX 4090", vram: 24, ram: 64 },
      capabilities: ["llama", "mistral"],
      location: "US-East",
      costPerToken: 2000,
    },
    supportedModels: ["llama-3.1-8b", "mistral-7b"],
    isActive: true,
    apiUrl: "ws://localhost:8080",
  },
  {
    address: "0x456...def",
    metadata: {
      hardware: { gpu: "RTX 3090", vram: 24, ram: 32 },
      capabilities: ["llama"],
      location: "EU-West",
      costPerToken: 1800,
    },
    supportedModels: ["llama-3.2-1b-instruct"],
    isActive: true,
    apiUrl: "ws://localhost:8081",
  },
];

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

      // Mock mode: NO SDK, NO BLOCKCHAIN - just mock objects for UI development
      if (IS_MOCK_MODE) {
        console.log(
          "🔧 MOCK MODE: Using simulated data - No SDK or blockchain"
        );

        // Set mock state immediately
        setUserAddress(MOCK_WALLET_ADDRESS);
        setIsAuthenticated(true);
        setSdk(null); // No SDK in mock mode

        // Create mock managers that simulate SDK behavior
        const mockSessionManager = {
          startSession: async () => {
            console.log("Mock: Starting session");
            return { sessionId: BigInt(1), jobId: BigInt(1) };
          },
          sendPromptStreaming: async (sessionId: bigint, prompt: string) => {
            console.log("Mock: Sending prompt", prompt);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
            return `Mock AI response to: "${prompt}". In production, this would be a real LLM response.`;
          },
          endSession: async () => {
            console.log("Mock: Ending session");
          },
        } as any;

        const mockHostManager = {
          discoverAllActiveHostsWithModels: async () => {
            console.log("Mock: Discovering hosts");
            await new Promise((resolve) => setTimeout(resolve, 500));
            return MOCK_HOSTS;
          },
          getHostStatus: async () => ({ isActive: true }),
        } as any;

        const mockPaymentManager = {
          getBalance: async () => BigInt(10000000), // 10 USDC
        } as any;

        setSessionManager(mockSessionManager);
        setHostManager(mockHostManager);
        setPaymentManager(mockPaymentManager);

        toast({
          title: "Mock Mode Active",
          description: "UI development mode - no blockchain connection",
        });

        setIsInitializing(false);
        return; // EXIT EARLY - no SDK initialization
      }

      // PRODUCTION MODE: Real SDK initialization
      toast({
        title: "Production Mode",
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

      // Get real managers from SDK
      setPaymentManager(newSdk.getPaymentManager());
      setSessionManager(await newSdk.getSessionManager());
      setHostManager(newSdk.getHostManager());
      setStorageManager(await newSdk.getStorageManager());
      setTreasuryManager(newSdk.getTreasuryManager());
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
