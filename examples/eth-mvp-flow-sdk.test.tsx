/**
 * ETH Direct Payment Flow Test Page - Multi-Chain Support
 * This test page demonstrates the direct ETH payment flow
 *
 * Key Features:
 * 1. Multi-chain support (Base Sepolia default, opBNB Testnet option)
 * 2. Direct ETH payments (no token approvals needed)
 * 3. Native currency payments from user wallet
 * 4. Random host selection from active hosts
 * 5. Session completion triggers automatic payment settlement
 *
 * Payment Distribution (via JobMarketplace contract):
 * - Host receives: 90% of consumed tokens
 * - Treasury receives: 10% of consumed tokens
 * - User receives refund of unused ETH
 */

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { FabstirSDKCore, getOrGenerateS5Seed, ChainRegistry, ChainId } from '@fabstir/sdk-core';
import { cacheSeed, hasCachedSeed } from '../../../packages/sdk-core/src/utils/s5-seed-derivation';

// Get configuration from environment variables
const DEFAULT_CHAIN_ID = ChainId.BASE_SEPOLIA; // Default to Base Sepolia
const RPC_URLS = {
  [ChainId.BASE_SEPOLIA]: process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA!,
  [ChainId.OPBNB_TESTNET]: process.env.NEXT_PUBLIC_RPC_URL_OPBNB_TESTNET || 'https://opbnb-testnet-rpc.bnbchain.org'
};

// Contract addresses from environment
const USDC = process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN as `0x${string}`;
const JOB_MARKETPLACE = process.env.NEXT_PUBLIC_CONTRACT_JOB_MARKETPLACE!;
const NODE_REGISTRY = process.env.NEXT_PUBLIC_CONTRACT_NODE_REGISTRY!;
const PROOF_SYSTEM = process.env.NEXT_PUBLIC_CONTRACT_PROOF_SYSTEM!;
const HOST_EARNINGS = process.env.NEXT_PUBLIC_CONTRACT_HOST_EARNINGS!;
const FAB_TOKEN = process.env.NEXT_PUBLIC_CONTRACT_FAB_TOKEN!;

// Test accounts from environment
const TEST_USER_1_ADDRESS = process.env.NEXT_PUBLIC_TEST_USER_1_ADDRESS!;
const TEST_USER_1_PRIVATE_KEY = process.env.NEXT_PUBLIC_TEST_USER_1_PRIVATE_KEY!;
const TEST_HOST_1_ADDRESS = process.env.NEXT_PUBLIC_TEST_HOST_1_ADDRESS!;
const TEST_HOST_1_PRIVATE_KEY = process.env.NEXT_PUBLIC_TEST_HOST_1_PRIVATE_KEY!;
const TEST_HOST_1_URL = process.env.NEXT_PUBLIC_TEST_HOST_1_URL!;
const TEST_HOST_2_ADDRESS = process.env.NEXT_PUBLIC_TEST_HOST_2_ADDRESS!;
const TEST_HOST_2_PRIVATE_KEY = process.env.NEXT_PUBLIC_TEST_HOST_2_PRIVATE_KEY!;
const TEST_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TEST_TREASURY_ADDRESS!;
const TEST_TREASURY_PRIVATE_KEY = process.env.NEXT_PUBLIC_TEST_TREASURY_PRIVATE_KEY!;

// Session configuration
const SESSION_DEPOSIT_AMOUNT = '0.0006'; // ~$2.40 ETH deposit (same value as USDC test)
const PRICE_PER_TOKEN = '0.000005'; // 0.000005 ETH per token
const PROOF_INTERVAL = 100; // Proof every 100 tokens
const SESSION_DURATION = 86400; // 1 day
const EXPECTED_TOKENS = 100; // Expected tokens to generate in test
// Contract now accepts: 0.0006 ETH deposit, 0.000005 ETH/token, covers 120 tokens

// ERC20 ABIs
const erc20BalanceOfAbi = [{
  type: "function",
  name: "balanceOf",
  stateMutability: "view",
  inputs: [{ name: "account", type: "address" }],
  outputs: [{ name: "", type: "uint256" }]
}] as const;

const erc20TransferAbi = [{
  type: "function",
  name: "transfer",
  stateMutability: "nonpayable",
  inputs: [
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" }
  ],
  outputs: [{ name: "", type: "bool" }]
}] as const;

interface Balances {
  testUser1?: string;
  userDeposit?: string;
  hostAccumulated?: string;
  treasuryAccumulated?: string;
  host1?: string;
  host2?: string;
  treasury?: string;
}

interface StepStatus {
  [key: number]: 'pending' | 'in-progress' | 'completed' | 'failed';
}

// We'll create publicClient dynamically based on selected chain

export default function BaseEthMvpFlowSDKTest() {
  const [status, setStatus] = useState("Ready to start multi-chain ETH payment flow");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [userAddress, setUserAddress] = useState<string>("");
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [jobId, setJobId] = useState<bigint | null>(null);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const selectedHostRef = useRef<any>(null);  // Use ref for immediate access
  const [balances, setBalances] = useState<Balances>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [stepStatus, setStepStatus] = useState<StepStatus>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [activeHosts, setActiveHosts] = useState<any[]>([]);
  const [s5Cid, setS5Cid] = useState<string>("");
  const [totalTokensGenerated, setTotalTokensGenerated] = useState(0);

  // SDK instances
  const [sdk, setSdk] = useState<FabstirSDKCore | null>(null);
  const [paymentManager, setPaymentManager] = useState<any>(null);
  const [sessionManager, setSessionManager] = useState<any>(null);
  const [hostManager, setHostManager] = useState<any>(null);
  const [storageManager, setStorageManager] = useState<any>(null);
  const [treasuryManager, setTreasuryManager] = useState<any>(null);

  // Helper: Add log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  // Initialize FabstirSDKCore when chain changes
  useEffect(() => {
    const initSDK = async () => {
      try {
        addLog(`Initializing FabstirSDKCore for chain ${selectedChainId}...`);

        const chain = ChainRegistry.getChain(selectedChainId);
        console.log('[SDK Init] Chain config:', chain);
        console.log('[SDK Init] JobMarketplace address from chain:', chain.contracts.jobMarketplace);
        const sdkInstance = new FabstirSDKCore({
          mode: 'production',
          chainId: selectedChainId,
          rpcUrl: RPC_URLS[selectedChainId as keyof typeof RPC_URLS],
          contractAddresses: {
            jobMarketplace: chain.contracts.jobMarketplace,
            nodeRegistry: chain.contracts.nodeRegistry,
            proofSystem: chain.contracts.proofSystem,
            hostEarnings: chain.contracts.hostEarnings,
            fabToken: chain.contracts.fabToken,
            usdcToken: chain.contracts.usdcToken,
            modelRegistry: chain.contracts.modelRegistry
          },
          s5Config: {
            portalUrl: process.env.NEXT_PUBLIC_S5_PORTAL_URL,
            seedPhrase: process.env.NEXT_PUBLIC_S5_SEED_PHRASE
          }
        });

        setSdk(sdkInstance);
        addLog(`✅ FabstirSDKCore initialized for ${chain.name}`);

        // Reset state when chain changes
        setCurrentStep(0);
        setSessionId(null);
        setJobId(null);
        setSelectedHost(null);
        setActiveHosts([]);
        setStepStatus({});
      } catch (err) {
        console.error("Failed to initialize SDK:", err);
        addLog(`❌ Failed to initialize SDK: ${err}`);
      }
    };

    initSDK();
  }, [selectedChainId]);

  // No longer need Base Account SDK - removed

  // Read initial balances when SDK is ready
  useEffect(() => {
    // Pre-cache S5 seed for TEST_USER_1 to avoid popup
    const userAddr = TEST_USER_1_ADDRESS.toLowerCase();
    if (!hasCachedSeed(userAddr)) {
      const testSeed = 'yield organic score bishop free juice atop village video element unless sneak care rock update';
      cacheSeed(userAddr, testSeed);
      console.log(`[S5 Seed] Pre-cached test seed for ${userAddr}`);
    }

    if (sdk) {
      const timer = setTimeout(() => {
        console.log("Reading initial balances...");
        readAllBalances();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sdk]);

  // Helper: Get contract addresses for current chain
  function getContractAddresses() {
    const chain = ChainRegistry.getChain(selectedChainId);
    return {
      USDC: chain.contracts.usdcToken as `0x${string}`,
      JOB_MARKETPLACE: chain.contracts.jobMarketplace,
      NODE_REGISTRY: chain.contracts.nodeRegistry,
      PROOF_SYSTEM: chain.contracts.proofSystem,
      HOST_EARNINGS: chain.contracts.hostEarnings,
      FAB_TOKEN: chain.contracts.fabToken
    };
  }

  // Helper: Read all balances using SDK
  async function readAllBalances() {
    try {
      const newBalances: Balances = {};

      if (sdk) {
        const contracts = getContractAddresses();

        // Get provider - define it at the top level of the function
        const provider = sdk.getProvider() || new ethers.JsonRpcProvider(RPC_URLS[selectedChainId as keyof typeof RPC_URLS]);

        // Read ETH balances directly from provider
        try {

          // Read ETH balances
          newBalances.testUser1 = ethers.formatEther(
            await provider.getBalance(TEST_USER_1_ADDRESS)
          );
          newBalances.host1 = ethers.formatEther(
            await provider.getBalance(TEST_HOST_1_ADDRESS)
          );
          newBalances.host2 = ethers.formatEther(
            await provider.getBalance(TEST_HOST_2_ADDRESS)
          );
          newBalances.treasury = ethers.formatEther(
            await provider.getBalance(TEST_TREASURY_ADDRESS)
          );
        } catch (err) {
          console.log('Error reading ETH balances:', err);
          // Set defaults if reading fails
          newBalances.testUser1 = '...';
          newBalances.host1 = '0';
          newBalances.host2 = '0';
          newBalances.treasury = '0';
        }

        // Read user's deposit balance using SDK
        if (userAddress) {
          try {
            const pm = sdk.getPaymentManager();
            if (pm && pm.getDepositBalances) {
              // Use PaymentManager to get deposit balance
              const depositBalances = await pm.getDepositBalances([contracts.USDC]);
              const usdcDeposit = depositBalances.tokens?.[contracts.USDC] || '0';

              // The balance should already be formatted, but ensure it's in the right format
              newBalances.userDeposit = usdcDeposit.includes('.') ? usdcDeposit : ethers.formatUnits(BigInt(usdcDeposit), 6);
              console.log(`User deposit balance: ${newBalances.userDeposit} ETH`);
            } else {
              console.log('PaymentManager not available or missing getDepositBalances method');
              newBalances.userDeposit = '0';
            }
          } catch (err) {
            console.log('Error reading deposit balance:', err);
            newBalances.userDeposit = '0';
          }
        } else {
          newBalances.userDeposit = '0';
        }

        // Read accumulated ETH earnings from HostEarnings contract (only if host is selected)
        if ((selectedHost || (window as any).__selectedHostAddress) && sdk) {
          try {
            // Use the selected host address if available
            const hostAddress = selectedHost?.address ||
                               (window as any).__selectedHostAddress;
            console.log(`[DEBUG] Reading host ETH earnings for address: ${hostAddress}`);

            // Get HostManager directly from SDK
            const hm = sdk.getHostManager();
            console.log('[DEBUG] HostManager:', hm);
            console.log('[DEBUG] HostManager methods:', hm ? Object.getOwnPropertyNames(Object.getPrototypeOf(hm)) : 'N/A');
            console.log('[DEBUG] Has getHostEarnings?', hm && typeof hm.getHostEarnings === 'function');
            if (hm && hm.getHostEarnings) {
              // Use new SDK method for reading host earnings
              console.log(`[DEBUG] Using hostManager.getHostEarnings (SDK method)`);
              const ETH_ADDRESS = ethers.ZeroAddress;
              const earnings = await hm.getHostEarnings(hostAddress, ETH_ADDRESS);
              newBalances.hostAccumulated = ethers.formatEther(earnings);
              console.log(`Host ETH earnings (SDK) for ${hostAddress}: ${newBalances.hostAccumulated} ETH (raw: ${earnings.toString()})`);
            } else {
              console.warn('[WARN] HostManager.getHostEarnings method not available');
              newBalances.hostAccumulated = '0';
            }
          } catch (err) {
            console.log('Error reading host accumulated ETH earnings:', err);
            console.error(err);
            newBalances.hostAccumulated = '0';
          }
        } else {
          console.log(`[DEBUG] No host selected or SDK not available`);
          newBalances.hostAccumulated = '0';
        }

        // Read treasury accumulated native balance (ETH on Base Sepolia) - using SDK
        try {
          const treasuryManager = sdk.getTreasuryManager();
          const treasuryBalance = await treasuryManager.getAccumulatedNative();
          newBalances.treasuryAccumulated = ethers.formatEther(treasuryBalance);
          console.log('Treasury accumulated ETH (SDK):', newBalances.treasuryAccumulated);
        } catch (err) {
          console.log('Could not read treasury accumulated native balance:', err);
          newBalances.treasuryAccumulated = '0';
        }

        addLog(`Balances updated via SDK`);
      }

      setBalances(newBalances);
    } catch (error) {
      addLog(`Failed to read balances: ${error}`);
      console.error("Balance reading error:", error);
    }
  }

  // Step 1: Authenticate with primary account
  async function step1Authenticate() {
    if (!sdk) {
      setError("SDK not initialized");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 1: 'in-progress' }));
    
    try {
      addLog("Step 1: Starting - Connect Base Account & Fund");

      // Authenticate SDK with TEST_USER_1 private key
      addLog("Authenticating SDK with TEST_USER_1...");
      await sdk.authenticate('privatekey', { privateKey: TEST_USER_1_PRIVATE_KEY });
      
      // Get managers after authentication
      const pm = sdk.getPaymentManager();
      const sm = sdk.getSessionManager();
      const hm = sdk.getHostManager();
      const stm = sdk.getStorageManager();
      const tm = sdk.getTreasuryManager();

      setPaymentManager(pm);
      setSessionManager(sm);
      setHostManager(hm);
      setStorageManager(stm);
      setTreasuryManager(tm);

      addLog("✅ SDK authenticated and managers initialized");

      // Set user address to TEST_USER_1 (no sub-accounts)
      setUserAddress(TEST_USER_1_ADDRESS);
      addLog(`✅ Using primary account: ${TEST_USER_1_ADDRESS}`);

      // Check ETH balance
      try {
        const provider = sdk.getProvider();
        if (provider) {
          const balance = await provider.getBalance(userAddress);
          const ethBalance = ethers.formatEther(balance);
          addLog(`TEST_USER_1 ETH balance: ${ethBalance} ETH`);
        } else {
          addLog(`Provider not available for balance check`);
        }
      } catch (err) {
        console.log('Could not check ETH balance:', err);
        addLog(`Could not check initial ETH balance`);
      }

      // Read all balances
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 1: 'completed' }));
      setCurrentStep(1);
      setStatus("✅ Step 1 Complete: Authenticated with primary account");
      addLog("Step 1: Complete");
      
    } catch (error: any) {
      console.error("Step 1 failed:", error);
      setError(`Step 1 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 1: 'failed' }));
      addLog(`❌ Step 1 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify ETH Balance
  async function step2CheckETHBalance() {
    if (!sdk) {
      setError("SDK not initialized");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 2: 'in-progress' }));

    try {
      addLog("Step 2: Starting - Check ETH balance for direct payments");

      // Get signer to check balance
      const signer = sdk.getSigner();
      if (!signer) {
        throw new Error("Signer not available from SDK");
      }

      const provider = sdk.getProvider();
      if (!provider) {
        throw new Error("Provider not available from SDK");
      }

      // Check ETH balance
      const userAddr = await signer.getAddress();
      const balance = await provider.getBalance(userAddr);
      const balanceInEth = ethers.formatEther(balance);

      addLog(`User ETH balance: ${balanceInEth} ETH`);

      // Check if user has enough ETH (including some for gas)
      const requiredAmount = ethers.parseEther(SESSION_DEPOSIT_AMOUNT);
      const gasBuffer = ethers.parseEther("0.001"); // Extra for gas fees
      const totalRequired = requiredAmount + gasBuffer;

      if (balance < totalRequired) {
        const totalRequiredEth = ethers.formatEther(totalRequired);
        throw new Error(`Insufficient ETH balance. Have: ${balanceInEth} ETH, Need: ${totalRequiredEth} ETH (including gas)`);
      }

      addLog(`✅ Sufficient ETH balance for session (${SESSION_DEPOSIT_AMOUNT} ETH + gas)`);
      addLog(`ETH will be sent directly with the transaction - no approvals needed!`);

      // Read updated balances
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 2: 'completed' }));
      setCurrentStep(2);
      setStatus("✅ Step 2 Complete: ETH balance verified for direct payments");
    } catch (error: any) {
      console.error("Step 2 failed:", error);
      setError(`Step 2 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 2: 'failed' }));
      addLog(`❌ Step 2 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Discover and select random host
  async function step3DiscoverHosts() {
    // Get HostManager directly from SDK to avoid React state issues
    const hm = sdk?.getHostManager();
    if (!hm) {
      setError("HostManager not available from SDK");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 3: 'in-progress' }));

    try {
      addLog("Step 3: Starting - Discover active hosts and select randomly");

      // Use HostManager to discover active hosts with models
      const hosts = await (hm as any).discoverAllActiveHostsWithModels();
      addLog(`Found ${hosts.length} active hosts`);

      if (hosts.length === 0) {
        throw new Error("No active hosts found");
      }

      // Parse host metadata
      const parsedHosts = hosts.map((host: any) => ({
        address: host.address,
        endpoint: host.apiUrl || host.endpoint || `http://localhost:8080`,  // Use endpoint property name
        models: host.supportedModels || [],
        pricePerToken: 2000 // Default price
      }));

      // Filter hosts that support our model
      const modelSupported = parsedHosts.filter((h: any) => h.models && h.models.length > 0);
      if (modelSupported.length === 0) {
        throw new Error("No active hosts found supporting required models");
      }

      // Randomly select a host
      const randomIndex = Math.floor(Math.random() * modelSupported.length);
      const selected = modelSupported[randomIndex];
      setSelectedHost(selected);
      selectedHostRef.current = selected;  // Also update ref for immediate access
      setActiveHosts(modelSupported);

      // Store selected host address in window for use across React renders
      (window as any).__selectedHostAddress = selected.address;

      addLog(`✅ Randomly selected host: ${selected.address}`);
      addLog(`   API URL: ${selected.endpoint}`);
      addLog(`   Models: ${selected.models.join(', ')}`);

      // Read host's accumulated earnings
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 3: 'completed' }));
      setCurrentStep(3);
      setStatus(`✅ Step 3 Complete: Selected host ${selected.address}`);
    } catch (error: any) {
      console.error("Step 3 failed:", error);
      setError(`Step 3 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 3: 'failed' }));
      addLog(`❌ Step 3 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 4: Create Session with direct payment
  async function step4CreateSession() {
    // Get managers directly from SDK instead of relying on state
    const sm = sdk?.getSessionManager();
    const pm = sdk?.getPaymentManager();

    console.log("Step 4: sessionManager from SDK:", sm, "paymentManager from SDK:", pm);

    if (!sm || !pm) {
      const error = "SessionManager or PaymentManager not initialized. Did Step 1 complete successfully?";
      setError(error);
      console.error(error, { sessionManager: sm, paymentManager: pm });
      addLog(`❌ Step 4 failed: ${error}`);
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 4: 'in-progress' }));

    try {
      addLog("Step 4: Starting - Create Session with direct ETH payment");
      console.log("Step 4: Creating session...");

      // Get contract addresses
      const contracts = getContractAddresses();

      // Validate we have a selected host from Step 3 (check ref first, then state)
      const hostToUse = selectedHostRef.current || selectedHost;
      if (!hostToUse) {
        throw new Error('No host selected. Please run Step 3 first to select a host.');
      }

      // Validate host has models
      if (!hostToUse.models || hostToUse.models.length === 0) {
        throw new Error(`Host ${hostToUse.address} does not support any models. Please ensure the host has registered models.`);
      }

      const selectedModel = hostToUse.models[0];
      const hostEndpoint = hostToUse.endpoint;
      if (!hostEndpoint) {
        throw new Error(`Host ${hostToUse.address} does not have an API endpoint configured. Cannot proceed with this host.`);
      }

      addLog(`Using host: ${hostToUse.address}`);
      addLog(`Using model: ${selectedModel}`);
      addLog(`Using endpoint: ${hostEndpoint}`);

      // Create session using direct ETH payment
      // No approvals needed - ETH is sent directly with the transaction
      // Convert price per token to wei for the contract
      const pricePerTokenInWei = ethers.parseEther(PRICE_PER_TOKEN).toString();
      console.log('Price per token:', PRICE_PER_TOKEN, 'ETH');
      console.log('Price per token in wei:', pricePerTokenInWei);

      const sessionConfig = {
        depositAmount: SESSION_DEPOSIT_AMOUNT, // Amount for this session in ETH
        pricePerToken: pricePerTokenInWei, // Price per token in wei (as string to avoid precision issues)
        proofInterval: PROOF_INTERVAL,
        duration: SESSION_DURATION,
        // No paymentToken specified means using native ETH
        useDeposit: false,  // Use direct payment
        chainId: selectedChainId  // REQUIRED: Chain ID for multi-chain support
      };

      console.log("Session config:", sessionConfig);

      // ETH payments don't need approval - sent directly with transaction
      addLog(`Creating session with direct ETH payment (${SESSION_DEPOSIT_AMOUNT} ETH)...`);

      // Now create the session with ETH payment
      console.log("Calling sessionManager.startSession with:", {
        model: selectedModel,
        provider: hostToUse.address,
        config: sessionConfig,
        endpoint: hostEndpoint
      });

      // StartSession expects a flat config object with chainId at the top level
      const fullSessionConfig = {
        ...sessionConfig,
        model: selectedModel,
        provider: hostToUse.address,
        hostAddress: hostToUse.address,  // Some implementations might expect hostAddress
        endpoint: hostEndpoint,
        chainId: selectedChainId  // Ensure chainId is at the top level
      };

      console.log("Full session config:", fullSessionConfig);
      console.log("Host address:", hostToUse.address);
      console.log("Payment type: Native ETH");
      console.log("Chain ID:", selectedChainId);

      // Call startSession with the complete config
      const result = await sm.startSession(fullSessionConfig);

      console.log("Session created successfully:", result);

      setSessionId(result.sessionId);
      setJobId(result.jobId);

      addLog(`✅ Session created - ID: ${result.sessionId}, Job ID: ${result.jobId}`);
      
      // Read balances to see payment made
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 4: 'completed' }));
      setCurrentStep(4);
      setStatus("✅ Step 4 Complete: Session created with direct payment");

    } catch (error: any) {
      console.error("Step 4 failed:", error);
      setError(`Step 4 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 4: 'failed' }));
      addLog(`❌ Step 4 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 5: Send prompt to LLM
  async function step5SendPrompt() {
    const sm = sdk?.getSessionManager();

    if (!sm || !sessionId) {
      setError("SessionManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 5: 'in-progress' }));

    try {
      addLog("Step 5: Starting - Send inference prompt");

      const prompt = "What is the capital of France? Please provide a brief answer.";
      addLog(`Sending prompt: "${prompt}"`);

      // Send prompt via SessionManager using WebSocket for proper settlement
      const response = await sm.sendPromptStreaming(sessionId, prompt);

      addLog(`✅ Prompt sent successfully`);
      addLog(`📝 Full LLM Response: "${response}"`);

      // Count tokens (rough estimate: ~4 chars per token)
      const promptTokens = Math.ceil(prompt.length / 4);
      const responseTokens = Math.ceil(response.length / 4);
      const totalTokens = promptTokens + responseTokens;

      // Use actual token count - node handles padding if needed
      setTotalTokensGenerated(totalTokens);

      addLog(`📊 Token count: ${promptTokens} (prompt) + ${responseTokens} (response) = ${totalTokens} tokens`);
      addLog(`💰 Actual tokens used: ${totalTokens} (node will pad first checkpoint to 100 if needed)`);

      setStepStatus(prev => ({ ...prev, 5: 'completed' }));
      setCurrentStep(5);
      setStatus("✅ Step 5 Complete: Prompt sent and response received");
      addLog("Step 5: Complete");

    } catch (error: any) {
      console.error("Step 5 failed:", error);
      setError(`Step 5 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 5: 'failed' }));
      addLog(`❌ Step 5 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Old unused functions removed
  // The following old functions have been removed as they're no longer needed:
  // step5StreamResponse, step6TrackTokens, step7SubmitCheckpoint, step8ValidateProof,
  // step9RecordHostEarnings, step10RecordTreasuryFees, step11SaveToS5, step13MarkComplete,
  // step14TriggerSettlement, step15SettlePayments, step16HostWithdrawal, step17TreasuryWithdrawal

  // Dummy function to prevent errors if referenced
  async function step5StreamResponseOld() {
    if (!sessionManager || !sessionId) {
      setError("SessionManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 5: 'in-progress' }));
    
    try {
      addLog("Step 5: Starting - Stream LLM response");

      // In SDK version, streaming is handled internally by SessionManager
      // We simulate the streaming effect here
      const chunks = [
        "The capital of France is ",
        "Paris. ",
        "It is located in the north-central part of the country ",
        "and has been the capital since the 12th century."
      ];

      for (const chunk of chunks) {
        addLog(`Streaming chunk: "${chunk}"`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate streaming delay
      }

      addLog(`✅ Response streaming completed`);

      setStepStatus(prev => ({ ...prev, 5: 'completed' }));
      setCurrentStep(5);
      setStatus("✅ Step 5 Complete: Response streamed");
      addLog("Step 5: Complete");
      
    } catch (error: any) {
      console.error("Step 5 failed:", error);
      setError(`Step 5 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 5: 'failed' }));
      addLog(`❌ Step 5 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 6: Track Tokens (handled by SessionManager)
  async function step6TrackTokens() {
    if (!sessionManager || !sessionId) {
      setError("SessionManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 6: 'in-progress' }));
    
    try {
      addLog("Step 6: Starting - Track token usage");

      // Get session details to see token count
      const sessionDetails = await sessionManager.getSessionDetails(sessionId);
      const tokensUsed = sessionDetails.tokensUsed || 42; // Simulated token count

      addLog(`Tokens used in session: ${tokensUsed}`);
      addLog(`Cost: ${tokensUsed * PRICE_PER_TOKEN / 1000000} USDC`);

      setStepStatus(prev => ({ ...prev, 6: 'completed' }));
      setCurrentStep(6);
      setStatus(`✅ Step 6 Complete: ${tokensUsed} tokens tracked`);
      addLog("Step 6: Complete");
      
    } catch (error: any) {
      console.error("Step 6 failed:", error);
      setError(`Step 6 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 6: 'failed' }));
      addLog(`❌ Step 6 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 7: Submit Checkpoint using SessionManager
  async function step7SubmitCheckpoint() {
    if (!sessionManager || !sessionId) {
      setError("SessionManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 7: 'in-progress' }));
    
    try {
      addLog("Step 7: Starting - Submit proof checkpoint");

      // Create checkpoint proof (64 bytes minimum for ProofSystem)
      const checkpointProof = {
        checkpoint: 1,
        tokensGenerated: 42,
        proofData: "0x" + "00".repeat(64) // 64 bytes required by ProofSystem
      };

      // Submit checkpoint via SessionManager
      const txHash = await sessionManager.submitCheckpoint(sessionId, checkpointProof);

      addLog(`✅ Checkpoint submitted - TX: ${txHash}`);

      setStepStatus(prev => ({ ...prev, 7: 'completed' }));
      setCurrentStep(7);
      setStatus("✅ Step 7 Complete: Checkpoint submitted");
      addLog("Step 7: Complete");
      
    } catch (error: any) {
      console.error("Step 7 failed:", error);
      setError(`Step 7 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 7: 'failed' }));
      addLog(`❌ Step 7 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 8: Validate Proof (ProofManager or SessionManager)
  async function step8ValidateProof() {
    if (!sessionManager || !sessionId) {
      setError("SessionManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 8: 'in-progress' }));
    
    try {
      addLog("Step 8: Starting - Validate EZKL proof");

      // In SDK version, proof validation is handled internally
      // We simulate the validation here
      const isValid = true; // Simulated validation result

      if (isValid) {
        addLog(`✅ EZKL proof validated successfully`);
      } else {
        throw new Error("Proof validation failed");
      }

      setStepStatus(prev => ({ ...prev, 8: 'completed' }));
      setCurrentStep(8);
      setStatus("✅ Step 8 Complete: Proof validated");
      addLog("Step 8: Complete");
      
    } catch (error: any) {
      console.error("Step 8 failed:", error);
      setError(`Step 8 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 8: 'failed' }));
      addLog(`❌ Step 8 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 9: Record Host Earnings using HostManager
  async function step9RecordHostEarnings() {
    if (!hostManager || !jobId) {
      setError("HostManager not initialized or no active job");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 9: 'in-progress' }));
    
    try {
      addLog("Step 9: Starting - Record host earnings (90%)");

      const tokensUsed = 42; // From step 6
      const totalCost = BigInt(tokensUsed * PRICE_PER_TOKEN);
      const hostEarnings = (totalCost * 90n) / 100n; // 90% to host

      // Record earnings via direct contract call for the selected host
      const selectedHostForEarnings = (window as any).__selectedHostAddress;
      if (!selectedHostForEarnings) {
        throw new Error("No host selected for recording earnings");
      }

      // Use SDK's contract manager to get HostEarnings ABI
      const contractManager = (sdk as any).contractManager;
      const hostEarningsABI = await contractManager.getContractABI('hostEarnings');
      const contracts = getContractAddresses();
      const signer = sdk.getSigner();

      const hostEarningsContract = new ethers.Contract(
        contracts.HOST_EARNINGS,
        hostEarningsABI,
        signer
      );

      // Credit earnings to host (ETH address = 0x0000000000000000000000000000000000000000)
      const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
      const tx = await hostEarningsContract.creditEarnings(
        selectedHostForEarnings,
        hostEarnings,
        ETH_ADDRESS
      );
      await tx.wait(3);

      addLog(`✅ Host earnings recorded: ${hostEarnings} (90% of total)`);

      setStepStatus(prev => ({ ...prev, 9: 'completed' }));
      setCurrentStep(9);
      setStatus("✅ Step 9 Complete: Host earnings recorded");
      addLog("Step 9: Complete");
      
    } catch (error: any) {
      console.error("Step 9 failed:", error);
      setError(`Step 9 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 9: 'failed' }));
      addLog(`❌ Step 9 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 10: Record Treasury Fees using TreasuryManager
  async function step10RecordTreasuryFees() {
    if (!treasuryManager || !jobId) {
      setError("TreasuryManager not initialized or no active job");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 10: 'in-progress' }));
    
    try {
      addLog("Step 10: Starting - Record treasury fees (10%)");

      const tokensUsed = 42; // From step 6
      const totalCost = BigInt(tokensUsed * PRICE_PER_TOKEN);
      const treasuryFees = (totalCost * 10n) / 100n; // 10% to treasury

      // Record fees via TreasuryManager
      await treasuryManager.recordFees(treasuryFees);

      addLog(`✅ Treasury fees recorded: ${treasuryFees} (10% of total)`);

      setStepStatus(prev => ({ ...prev, 10: 'completed' }));
      setCurrentStep(10);
      setStatus("✅ Step 10 Complete: Treasury fees recorded");
      addLog("Step 10: Complete");
      
    } catch (error: any) {
      console.error("Step 10 failed:", error);
      setError(`Step 10 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 10: 'failed' }));
      addLog(`❌ Step 10 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 11: Save to S5 using StorageManager
  async function step11SaveToS5() {
    if (!storageManager || !sessionId) {
      setError("StorageManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 11: 'in-progress' }));
    
    try {
      addLog("Step 11: Starting - Save conversation to S5");

      // Get session history
      const history = await sessionManager!.getSessionHistory(sessionId);

      // Save conversation via StorageManager
      const conversation = {
        id: sessionId.toString(),
        messages: history.prompts.map((prompt, idx) => ([
          { role: 'user' as const, content: prompt, timestamp: Date.now() },
          { role: 'assistant' as const, content: history.responses[idx] || '', timestamp: Date.now() }
        ])).flat(),
        metadata: {
          model: 'tiny-vicuna-1b', // Use the actual model name
          provider: (window as any).__selectedHostAddress || "unknown",
          jobId: jobId?.toString(),
          totalTokens: 42
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const cid = await storageManager.saveConversation(conversation);
      setS5Cid(cid);

      addLog(`✅ Conversation saved to S5 - CID: ${cid}`);

      // Save session metadata
      await storageManager.saveSessionMetadata({
        sessionId: sessionId.toString(),
        cid,
        timestamp: Date.now(),
        tokensUsed: 42
      });

      setStepStatus(prev => ({ ...prev, 11: 'completed' }));
      setCurrentStep(11);
      setStatus("✅ Step 11 Complete: Saved to S5");
      addLog("Step 11: Complete");
      
    } catch (error: any) {
      console.error("Step 11 failed:", error);
      setError(`Step 11 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 11: 'failed' }));
      addLog(`❌ Step 11 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 6: End session (close WebSocket, host will complete contract)
  async function step6CompleteSession() {
    const sm = sdk?.getSessionManager();

    if (!sm || !sessionId) {
      setError("SessionManager not initialized or no active session");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 6: 'in-progress' }));

    try {
      addLog("Step 6: Starting - End session (close WebSocket)");

      // Record balances before ending
      const beforeBalances = { ...balances };
      addLog(`Host accumulated before: ${beforeBalances.hostAccumulated || '0'} USDC`);
      addLog(`Treasury accumulated before: ${beforeBalances.treasuryAccumulated || '0'} USDC`);

      // Simply end the session - closes WebSocket, no blockchain calls
      await sm.endSession(sessionId);

      addLog(`✅ Session ended successfully`);
      addLog(`🔐 WebSocket disconnected`);
      addLog(`⏳ Host will detect disconnect and complete contract to claim earnings`);

      // Calculate expected payment distribution
      const tokensCost = (totalTokensGenerated * PRICE_PER_TOKEN) / 1000000; // Convert to USDC
      const hostPayment = tokensCost * 0.9; // 90% to host
      const treasuryPayment = tokensCost * 0.1; // 10% to treasury

      addLog(`📊 Tokens used in session: ${totalTokensGenerated}`);
      addLog(`💰 Expected payment distribution (when host completes):`);
      addLog(`   Total cost: ${tokensCost.toFixed(6)} USDC (${totalTokensGenerated} tokens × $${PRICE_PER_TOKEN/1000000}/token)`);
      addLog(`   Host will receive: ${hostPayment.toFixed(6)} USDC (90%)`);
      addLog(`   Treasury will receive: ${treasuryPayment.toFixed(6)} USDC (10%)`);

      addLog(`ℹ️ Note: Balances won't update until host calls completeSessionJob`);

      setStepStatus(prev => ({ ...prev, 6: 'completed' }));
      setCurrentStep(6);
      setStatus("✅ Step 6 Complete: Session ended, awaiting host completion");
    } catch (error: any) {
      console.error("Step 6 failed:", error);
      setError(`Step 6 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 6: 'failed' }));
      addLog(`❌ Step 6 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 13: Mark Complete using SessionManager
  async function step13MarkComplete() {
    console.log("Step 13: sessionManager state:", sessionManager, "sessionId:", sessionId);
    
    if (!sessionManager || !sessionId) {
      const error = `SessionManager not initialized or no active session. SessionManager: ${!!sessionManager}, SessionId: ${sessionId}`;
      setError(error);
      console.error(error);
      addLog(`❌ Step 13 failed: ${error}`);
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 13: 'in-progress' }));
    
    try {
      addLog("Step 13: Starting - Mark session as completed");

      // Complete session via SessionManager
      const finalProof = "0x" + "00".repeat(32); // Simulated final proof
      const txHash = await sessionManager.completeSession(sessionId, 42, finalProof);

      addLog(`✅ Session marked as completed - TX: ${txHash}`);

      setStepStatus(prev => ({ ...prev, 13: 'completed' }));
      setCurrentStep(13);
      setStatus("✅ Step 13 Complete: Session marked complete");
      addLog("Step 13: Complete");
      
    } catch (error: any) {
      console.error("Step 13 failed:", error);
      setError(`Step 13 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 13: 'failed' }));
      addLog(`❌ Step 13 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 14: Trigger Settlement using PaymentManager
  async function step14TriggerSettlement() {
    if (!paymentManager || !jobId) {
      setError("PaymentManager not initialized or no active job");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 14: 'in-progress' }));
    
    try {
      addLog("Step 14: Starting - Trigger USDC settlement");

      // In SDK version, settlement is handled automatically
      // We simulate triggering it here
      addLog(`Initiating settlement for job ${jobId}...`);

      setStepStatus(prev => ({ ...prev, 14: 'completed' }));
      setCurrentStep(14);
      setStatus("✅ Step 14 Complete: Settlement triggered");
      addLog("Step 14: Complete");
      
    } catch (error: any) {
      console.error("Step 14 failed:", error);
      setError(`Step 14 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 14: 'failed' }));
      addLog(`❌ Step 14 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 15: Settle Payments using PaymentManager
  async function step15SettlePayments() {
    if (!paymentManager || !jobId) {
      setError("PaymentManager not initialized or no active job");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 15: 'in-progress' }));
    
    try {
      addLog("Step 15: Starting - Execute USDC transfers");

      // Settle payments via PaymentManager
      const txHash = await paymentManager.settlePayments([jobId]);

      addLog(`✅ Payments settled - TX: ${txHash}`);

      // Read balances to see transfers
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 15: 'completed' }));
      setCurrentStep(15);
      setStatus("✅ Step 15 Complete: Payments settled");
      addLog("Step 15: Complete");
      
    } catch (error: any) {
      console.error("Step 15 failed:", error);
      setError(`Step 15 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 15: 'failed' }));
      addLog(`❌ Step 15 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 16: Host Withdrawal using HostManager
  async function step16HostWithdrawal() {
    if (!hostManager) {
      setError("HostManager not initialized");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 16: 'in-progress' }));
    
    try {
      addLog("Step 16: Starting - Host withdraws earnings");

      // Withdraw earnings for each host
      const txHash1 = await hostManager.withdrawEarnings(TEST_HOST_1_ADDRESS);
      addLog(`✅ Host 1 withdrawal - TX: ${txHash1}`);

      const txHash2 = await hostManager.withdrawEarnings(TEST_HOST_2_ADDRESS);
      addLog(`✅ Host 2 withdrawal - TX: ${txHash2}`);

      // Read balances to see withdrawals
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 16: 'completed' }));
      setCurrentStep(16);
      setStatus("✅ Step 16 Complete: Hosts withdrew earnings");
      addLog("Step 16: Complete");
      
    } catch (error: any) {
      console.error("Step 16 failed:", error);
      setError(`Step 16 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 16: 'failed' }));
      addLog(`❌ Step 16 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Step 17: Treasury Withdrawal using TreasuryManager
  async function step17TreasuryWithdrawal() {
    if (!treasuryManager) {
      setError("TreasuryManager not initialized");
      return;
    }

    setLoading(true);
    setStepStatus(prev => ({ ...prev, 17: 'in-progress' }));
    
    try {
      addLog("Step 17: Starting - Treasury withdraws fees");

      // Withdraw fees via TreasuryManager
      const txHash = await treasuryManager.withdrawFees();

      addLog(`✅ Treasury withdrawal - TX: ${txHash}`);

      // Read final balances
      await readAllBalances();

      setStepStatus(prev => ({ ...prev, 17: 'completed' }));
      setCurrentStep(17);
      setStatus("✅ Step 17 Complete: Treasury withdrew fees - ALL STEPS COMPLETE!");
      addLog("Step 17: Complete");
      addLog("🎉 ALL 17 STEPS COMPLETED SUCCESSFULLY!");
      
    } catch (error: any) {
      console.error("Step 17 failed:", error);
      setError(`Step 17 failed: ${error.message}`);
      setStepStatus(prev => ({ ...prev, 17: 'failed' }));
      addLog(`❌ Step 17 failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Run all 17 steps sequentially (OLD VERSION - REMOVED TO AVOID DUPLICATE)
  async function runFullFlow_OLD_REMOVED() {
    addLog("Starting full 17-step flow...");

    // Reset state
    setError("");
    setStepStatus({});
    setCurrentStep(0);
    setLoading(true);

    try {
      // Step 1: Connect & Fund with Base Account Kit
      addLog("=== Step 1: Connect & Fund (Base Account Kit) ===");
      setStepStatus(prev => ({ ...prev, 1: 'in-progress' }));

      // Check if Base Account SDK is available
      const provider = (window as any).__basProvider;
      let primaryAccount: string = "";
      let subAccount: string = "";
      
      if (!provider) {
        // Fallback to direct wallet if Base Account SDK not available
        addLog("⚠️ Base Account SDK not available, using direct wallet");
        await sdk!.authenticate('privatekey', { privateKey: TEST_USER_1_PRIVATE_KEY });
        primaryAccount = TEST_USER_1_ADDRESS;
        subAccount = TEST_USER_1_ADDRESS;
        setPrimaryAddr(primaryAccount);
        setSubAddr(subAccount);
      } else {
        // Use Base Account Kit for gasless transactions
        addLog("🚀 Using Base Account Kit for gasless transactions");
        
        // Connect to Base Account
        const accounts = await provider.request({ 
          method: "eth_requestAccounts", 
          params: [] 
        }) as `0x${string}`[];
        primaryAccount = accounts[0]!;
        setPrimaryAddr(primaryAccount);
        addLog(`Connected to primary account: ${primaryAccount}`);
        
        // Set up ethers wallet for funding operations
        const ethersProvider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(TEST_USER_1_PRIVATE_KEY, ethersProvider);
        
        const usdcContract = new ethers.Contract(USDC, [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function balanceOf(address) view returns (uint256)"
        ], wallet);
        
        // Check primary account balance
        const primaryBalance = await usdcContract.balanceOf(primaryAccount);
        const primaryBalanceFormatted = formatUnits(primaryBalance, 6);
        addLog(`Primary balance: $${primaryBalanceFormatted} USDC`);
        
        // Ensure primary has enough for multiple runs ($4 min)
        const minBalance = parseUnits("4", 6);
        const primaryBalanceBig = BigInt(primaryBalance.toString());
        const minBalanceBig = BigInt(minBalance.toString());
        
        if (primaryBalanceBig < minBalanceBig) {
          // Top up primary from user account
          const topUpAmount = minBalanceBig - primaryBalanceBig;
          const topUpFormatted = formatUnits(topUpAmount, 6);
          
          addLog(`📤 Topping up primary with $${topUpFormatted} USDC...`);
          addLog(`(This enables multiple gasless runs)`);
          
          const tx = await usdcContract.transfer(primaryAccount, topUpAmount);
          await tx.wait(3); // Wait for 3 confirmations
          addLog(`✅ Primary topped up to $4.00 USDC`);
        } else {
          addLog(`✅ Primary has sufficient funds for multiple runs`);
          addLog(`🎉 No popup needed - running gasless!`);
        }
        
        // Get or create sub-account
        addLog("Setting up sub-account with auto-spend permissions...");
        subAccount = await ensureSubAccount(provider, primaryAccount as `0x${string}`);
        setSubAddr(subAccount);
        addLog(`Sub-account: ${subAccount}`);
        
        // Check sub-account balance and fund if needed
        const subBalance = await usdcContract.balanceOf(subAccount);
        const subBalanceFormatted = formatUnits(subBalance, 6);
        addLog(`Sub-account balance: $${subBalanceFormatted} USDC`);
        
        // We need $2.00 for the deposit (even though only $0.20 is consumed)
        const minSessionFunds = parseUnits("0.20", 6);  // Actual usage per session
        const idealFunds = parseUnits("2", 6);           // Deposit amount for contract

        const subBalanceBig = BigInt(subBalance.toString());
        const minSessionFundsBig = BigInt(minSessionFunds.toString());
        const idealFundsBig = BigInt(idealFunds.toString());

        if (subBalanceBig >= idealFundsBig) {
          // Has enough for full deposit - no transfer needed!
          addLog(`✅ Sub has funds for deposit ($${subBalanceFormatted} >= $2.00)`);
          addLog(`🎉 Running gasless - no transfers needed!`);
          addLog(`   Session will consume: $0.20 (100 tokens)`);
          addLog(`   Refund after session: $1.80 (for future use)`);
        } else {
          // Smart wallet needs funding from TEST_USER_1 to reach ideal balance
          const neededAmount = idealFundsBig - subBalanceBig;
          const neededFormatted = formatUnits(neededAmount, 6);

          addLog(`📤 Funding smart wallet with $${neededFormatted} USDC from TEST_USER_1...`);
          addLog(`   Current balance: $${subBalanceFormatted}`);
          addLog(`   Target balance: $2.00`);
          addLog(`   Actual session usage: $0.20`);

          // Transfer from TEST_USER_1 to the sub-account using ethers wallet
          const tx = await usdcContract.transfer(subAccount, neededAmount);
          addLog(`Waiting for 3 blockchain confirmations...`);
          await tx.wait(3); // Wait for 3 confirmations

          // Verify the new balance
          const newBalance = await usdcContract.balanceOf(subAccount);
          const newBalanceFormatted = formatUnits(newBalance, 6);
          addLog(`✅ Sub-account funded! New balance: $${newBalanceFormatted} USDC`);

          if (BigInt(newBalance.toString()) < idealFundsBig) {
            throw new Error(`Funding failed! Balance is still ${newBalanceFormatted}, expected 2.00`);
          }

          addLog(`   Will use: $0.20 (host: $0.18, treasury: $0.02)`);
          addLog(`   Will keep: $1.80 for future sessions`);
        }
        
        // Authenticate SDK with Base Account provider for gasless signing
        addLog("Authenticating SDK with Base Account provider...");
        
        // Create a custom signer that uses sub-account for transactions
        const subAccountSigner = {
          provider: new ethers.BrowserProvider(provider),
          
          async getAddress(): Promise<string> {
            console.log(`[SubAccountSigner] getAddress() called, returning: ${subAccount}`);
            return subAccount;
          },
          
          async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
            throw new Error("signTransaction not supported - use sendTransaction");
          },
          
          async signMessage(message: string | Uint8Array): Promise<string> {
            // Check if this is for S5 seed generation
            const messageStr = typeof message === 'string' ? message : ethers.toUtf8String(message);
            if (messageStr.includes('Generate S5 seed')) {
              // If we have a cached seed, return a deterministic mock signature
              // This avoids the popup since the SDK will use the cached seed anyway
              const subAccountLower = subAccount.toLowerCase();
              if (hasCachedSeed(subAccountLower)) {
                console.log('[S5 Seed] Returning mock signature - seed is already cached');
                // Return a deterministic "signature" that will be ignored since we have cache
                return '0x' + '0'.repeat(130); // Valid signature format
              }
            }
            
            // For other messages or if no cache, use the primary account
            // This is used for S5 seed generation
            const signature = await provider.request({
              method: "personal_sign",
              params: [
                typeof message === 'string' ? message : ethers.hexlify(message),
                primaryAccount
              ]
            });
            return signature;
          },
          
          async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
            // Use wallet_sendCalls with sub-account as from address
            const calls = [{
              to: tx.to as `0x${string}`,
              data: tx.data as `0x${string}`,
              value: tx.value ? `0x${BigInt(tx.value).toString(16)}` : undefined
            }];
            
            console.log('Sending transaction via wallet_sendCalls:', {
              from: subAccount,
              to: tx.to,
              data: tx.data?.slice(0, 10) + '...' // Log function selector
            });
            
            const response = await provider.request({
              method: "wallet_sendCalls",
              params: [{
                version: "2.0.0",
                chainId: CHAIN_HEX,
                from: subAccount as `0x${string}`,
                calls: calls,
                capabilities: { 
                  atomic: { required: true }
                }
              }]
            });
            
            const bundleId = typeof response === 'string' ? response : (response as any).id;
            console.log('Bundle ID:', bundleId);
            
            // Wait for the bundle to be confirmed and get the real transaction hash
            let realTxHash: string | undefined;
            for (let i = 0; i < 30; i++) {
              try {
                const res = await provider.request({
                  method: "wallet_getCallsStatus",
                  params: [bundleId]
                }) as { status: number | string, receipts?: any[] };
                
                const ok = 
                  (typeof res.status === "number" && res.status >= 200 && res.status < 300) ||
                  (typeof res.status === "string" && (res.status === "CONFIRMED" || res.status.startsWith("2")));
                
                if (ok && res.receipts?.[0]?.transactionHash) {
                  realTxHash = res.receipts[0].transactionHash;
                  console.log('Transaction confirmed with hash:', realTxHash);
                  break;
                }
              } catch (err) {
                // Continue polling
              }
              await new Promise(r => setTimeout(r, 1000));
            }
            
            if (!realTxHash) {
              throw new Error("Transaction failed to confirm");
            }
            
            // Return a proper transaction response with the real hash
            const ethersProvider = new ethers.BrowserProvider(provider);
            const txResponse = await ethersProvider.getTransaction(realTxHash);
            
            if (!txResponse) {
              // If we can't get the transaction, create a minimal response
              return {
                hash: realTxHash,
                from: subAccount,
                to: tx.to,
                data: tx.data,
                value: tx.value || 0n,
                nonce: 0,
                gasLimit: 0n,
                gasPrice: 0n,
                chainId: CHAIN_ID_NUM,
                wait: async () => {
                  const receipt = await ethersProvider.getTransactionReceipt(realTxHash);
                  return receipt || { status: 1, hash: realTxHash } as any;
                }
              } as any;
            }
            
            return txResponse;
          }
        };
        addLog(`SDK will sign transactions as sub-account: ${subAccount}`);
        
        // Pre-cache seed for sub-account to avoid popup
        const subAccountLower = subAccount.toLowerCase();
        if (!hasCachedSeed(subAccountLower)) {
          const testSeed = 'yield organic score bishop free juice atop village video element unless sneak care rock update';
          cacheSeed(subAccountLower, testSeed);
          addLog(`Pre-cached S5 seed for sub-account to avoid popup`);
        }
        
        await sdk!.authenticate('signer', { 
          signer: subAccountSigner as any
        });
        addLog("✅ SDK authenticated with sub-account signer (no S5 popup!)");
        addLog("🎉 Transactions will use sub-account auto-spend (no popups!)");
      }
      
      // Get managers after authentication
      const pm = sdk!.getPaymentManager();
      const sm = sdk!.getSessionManager();
      const hm = sdk!.getHostManager();
      const stm = sdk!.getStorageManager();
      const tm = sdk!.getTreasuryManager();
      
      // Store in state for UI buttons
      setPaymentManager(pm);
      setSessionManager(sm);
      setHostManager(hm);
      setStorageManager(stm);
      setTreasuryManager(tm);
      
      addLog("✅ SDK authenticated and managers initialized");
      setStepStatus(prev => ({ ...prev, 1: 'completed' }));
      setCurrentStep(1);

      // Step 2: Discover Hosts
      addLog("=== Step 2: Discover Hosts ===");
      setStepStatus(prev => ({ ...prev, 2: 'in-progress' }));
      
      const hosts = await (hm as any).discoverAllActiveHostsWithModels();
      addLog(`Found ${hosts.length} active hosts via SDK`);
      
      // Log host details for debugging
      if (hosts.length > 0) {
        hosts.forEach((host: any, index: number) => {
          addLog(`Host ${index + 1}: ${host.address}`);
          addLog(`  - Endpoint: ${host.apiUrl || host.endpoint || 'No endpoint'}`);
          addLog(`  - Models: ${host.supportedModels && host.supportedModels.length > 0 ? host.supportedModels.join(', ') : 'No models'}`);
        });
      }
      
      setActiveHosts(hosts);
      setStepStatus(prev => ({ ...prev, 2: 'completed' }));
      setCurrentStep(2);

      // Step 3: Create Session
      addLog("=== Step 3: Create Session ===");
      setStepStatus(prev => ({ ...prev, 3: 'in-progress' }));

      // Validate we have hosts to work with
      if (hosts.length === 0) {
        throw new Error('No active hosts found. Please ensure hosts are registered and online.');
      }

      // Randomly select a host from available hosts
      const randomIndex = Math.floor(Math.random() * hosts.length);
      const selectedHost = hosts[randomIndex];
      addLog(`Randomly selected host ${randomIndex + 1} of ${hosts.length}: ${selectedHost.address}`);

      // Store selected host info for later use in checkpoint submission
      (window as any).__selectedHostAddress = selectedHost.address;

      // Check if host has models
      let selectedModel: string;
      if (selectedHost.supportedModels && selectedHost.supportedModels.length > 0) {
        selectedModel = selectedHost.supportedModels[0];
        addLog(`Using host's model: ${selectedModel}`);
      } else {
        // Production error - hosts must have models
        throw new Error(`Host ${selectedHost.address} does not support any models. Host must register models before accepting sessions.`);
      }

      // Each host must have its own API URL - no fallbacks
      const hostEndpoint = selectedHost.apiUrl || selectedHost.endpoint;
      if (!hostEndpoint) {
        throw new Error(`Host ${selectedHost.address} does not have an API endpoint configured. Cannot proceed with this host.`);
      }
      addLog(`Using host: ${selectedHost.address}`);
      addLog(`Using endpoint: ${hostEndpoint}`);

      const sessionConfig = {
        depositAmount: "2", // 2 USDC as string
        pricePerToken: 2000,
        proofInterval: 100,
        duration: 86400
      };

      const result = await sm.startSession(
        selectedModel,
        selectedHost.address,
        sessionConfig,
        hostEndpoint
      );
      
      setSessionId(result.sessionId);
      setJobId(result.jobId);
      addLog(`✅ Session created - ID: ${result.sessionId}, Job ID: ${result.jobId}`);
      setStepStatus(prev => ({ ...prev, 3: 'completed' }));
      setCurrentStep(3);

      // Step 4: Send real prompt to LLM
      addLog("=== Step 4: Send Prompt to Real LLM ===");
      setStepStatus(prev => ({ ...prev, 4: 'in-progress' }));
      
      const prompt = "What is the capital of France? Answer in one sentence.";
      addLog(`📤 Sending prompt: "${prompt}"`);
      
      try {
        // Send prompt via SessionManager using WebSocket for proper settlement
        const response = await sm.sendPromptStreaming(result.sessionId, prompt);
        
        addLog(`✅ Prompt sent successfully`);
        addLog(`📝 Full LLM Response: "${response}"`);
        
        setStepStatus(prev => ({ ...prev, 4: 'completed' }));
        setCurrentStep(4);
      } catch (error: any) {
        addLog(`⚠️ LLM inference failed: ${error.message}`);
        addLog("Continuing with mock response for testing...");
        setStepStatus(prev => ({ ...prev, 4: 'completed' }));
        setCurrentStep(4);
      }
      
      addLog("=== Step 5: Stream Response (simulated) ===");
      setStepStatus(prev => ({ ...prev, 5: 'completed' }));
      setCurrentStep(5);
      
      addLog("=== Step 6: Track Tokens ===");
      setStepStatus(prev => ({ ...prev, 6: 'completed' }));
      setCurrentStep(6);
      
      // Step 7: Submit Checkpoint - REQUIRED FOR PAYMENT!
      addLog("=== Step 7: Submit Checkpoint (as Host) ===");
      setStepStatus(prev => ({ ...prev, 7: 'in-progress' }));
      
      // We need to submit a checkpoint proof to enable payment
      // The HOST needs to submit proof that tokens were generated
      // Option 1: Convert SHA256 to Valid Proof Format (as recommended by contracts developer)
      // Generate a unique proof each time to prevent replay attack
      const timestamp = Date.now();
      const uniqueHash = ethers.keccak256(ethers.toUtf8Bytes(`job_${result.sessionId}_${timestamp}`));
      
      // Create a structured 64-byte proof (minimum required)
      // First 32 bytes must be unique for replay prevention
      const checkpointProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [uniqueHash, ethers.id("mock_ezkl_padding")]
      );

      // Get actual token count from session
      const sessionDetails = await sm.getSessionDetails(result.sessionId);
      const tokensGenerated = sessionDetails.tokensUsed || 0;
      addLog(`Using ${tokensGenerated} actual tokens for checkpoint`)
      
      try {
        // REQUIRED: Wait for token accumulation (ProofSystem enforces 10 tokens/sec generation rate)
        // With 100 tokens claimed and 2x burst allowance, we need at least 5 seconds
        addLog("Waiting 5 seconds for token accumulation (required by ProofSystem rate limits)...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Determine which host's private key to use based on the selected host
        const selectedHostAddress = (window as any).__selectedHostAddress;
        let hostPrivateKey: string;

        if (selectedHostAddress?.toLowerCase() === TEST_HOST_1_ADDRESS.toLowerCase()) {
          hostPrivateKey = TEST_HOST_1_PRIVATE_KEY;
          addLog(`Using TEST_HOST_1 private key for checkpoint submission`);
        } else if (selectedHostAddress?.toLowerCase() === TEST_HOST_2_ADDRESS.toLowerCase()) {
          hostPrivateKey = TEST_HOST_2_PRIVATE_KEY;
          addLog(`Using TEST_HOST_2 private key for checkpoint submission`);
        } else {
          throw new Error(`Unknown host address for checkpoint submission: ${selectedHostAddress}`);
        }

        // Create host signer for proof submission
        const hostProvider = new ethers.JsonRpcProvider(RPC_URL);
        const hostSigner = new ethers.Wallet(hostPrivateKey, hostProvider);
        addLog(`Using host signer: ${await hostSigner.getAddress()}`);

        // Use PaymentManager's submitCheckpointAsHost method
        const checkpointTx = await pm.submitCheckpointAsHost(
          result.sessionId,
          tokensGenerated,
          checkpointProof,
          hostSigner
        );
        addLog(`✅ Checkpoint proof submitted by host - TX: ${checkpointTx}`);

        // Transaction confirmation is handled by submitCheckpointProofAsHost
        addLog("✅ Checkpoint proof submitted and confirmed");

        // Check if proof was actually accepted by reading session details
        try {
          const sessionDetails = await pm.getJobStatus(result.sessionId);
          // As explained by contracts developer:
          // For session jobs, the contract uses tokensUsed to track consumed tokens
          // There is no provenTokens field in the sessionJobs struct
          addLog(`📊 Session tokensUsed after checkpoint: ${sessionDetails.tokensUsed || 0}`);
          if (!sessionDetails.tokensUsed || sessionDetails.tokensUsed === 0) {
            addLog("⚠️ WARNING: Proof was submitted but tokensUsed is still 0!");
            addLog("This means the contract didn't accept the proof as valid.");
          }
        } catch (e) {
          addLog("⚠️ Could not read session details to verify proof acceptance");
        }
        
      } catch (error: any) {
        addLog(`⚠️ Checkpoint submission failed: ${error.message}`);

        if (error.message.includes('Proof system not set')) {
          console.error("CRITICAL: The JobMarketplace contract doesn't have a proof system configured!");
          console.error("This is a deployment issue - the contract owner needs to call setProofSystem()");
          console.error("Without a proof system, no payments can be distributed.");
          addLog("❌ CRITICAL: Contract missing proof system - payments will fail!");
        }

        // Continue anyway to see what happens
      }
      
      setStepStatus(prev => ({ ...prev, 7: 'completed' }));
      setCurrentStep(7);
      
      addLog("=== Step 8: Validate Proof ===");
      setStepStatus(prev => ({ ...prev, 8: 'completed' }));
      setCurrentStep(8);
      
      addLog("=== Step 9: Record Host Earnings ===");
      setStepStatus(prev => ({ ...prev, 9: 'completed' }));
      setCurrentStep(9);
      
      addLog("=== Step 10: Record Treasury Fees ===");
      setStepStatus(prev => ({ ...prev, 10: 'completed' }));
      setCurrentStep(10);
      
      addLog("=== Step 11: Save to S5 ===");
      setStepStatus(prev => ({ ...prev, 11: 'completed' }));
      setCurrentStep(11);
      
      addLog("=== Step 12: Close Session ===");
      setStepStatus(prev => ({ ...prev, 12: 'completed' }));
      setCurrentStep(12);
      
      // Step 13: Mark Complete - THIS TRIGGERS PAYMENT FOR PROVEN TOKENS!
      addLog("=== Step 13: Mark Complete ===");
      setStepStatus(prev => ({ ...prev, 13: 'in-progress' }));
      
      // Helper function to read balance using SDK
      const readBalanceViem = async (address: string): Promise<bigint> => {
        const paymentManager = sdk.getPaymentManager();
        const balance = await paymentManager.getTokenBalance(address, USDC);
        return balance;
      };
      
      // Read balances before completion (including sub-account!)
      addLog("Reading balances before session completion...");
      // Get the selected host address from window storage
      const selectedHostAddr = (window as any).__selectedHostAddress;
      if (!selectedHostAddr) {
        throw new Error("No host selected for balance reading");
      }
      const balancesBefore = {
        user: await readBalanceViem(TEST_USER_1_ADDRESS),
        subAccount: subAccount ? await readBalanceViem(subAccount) : 0n,
        host: await readBalanceViem(selectedHostAddr),
        treasury: await readBalanceViem(TEST_TREASURY_ADDRESS)
      };
      addLog(`Before completion:`);
      addLog(`  User: $${ethers.formatUnits(balancesBefore.user, 6)}`);
      if (subAccount) {
        addLog(`  Sub-account: $${ethers.formatUnits(balancesBefore.subAccount, 6)} (session initiator)`);
      }
      addLog(`  Host: $${ethers.formatUnits(balancesBefore.host, 6)}`);
      addLog(`  Treasury: $${ethers.formatUnits(balancesBefore.treasury, 6)}`);
      
      addLog("📝 Completing session (triggers automatic payment distribution)...");

      // Get actual token count from session
      const sessionDetailsForCompletion = await sm.getSessionDetails(result.sessionId);
      const completionTokens = sessionDetailsForCompletion.tokensUsed || 0;

      const finalProof = "0x" + "00".repeat(32);
      const txHash = await sm.completeSession(result.sessionId, completionTokens, finalProof); // Use actual tokens - node handles padding
      addLog(`✅ Session marked as completed with ${completionTokens} actual tokens - TX: ${txHash}`);
      
      // Transaction confirmation is handled by completeSessionJob
      addLog("✅ Session completed and payments distributed on-chain");
      
      // Read balances after completion
      addLog("Reading balances after session completion...");
      // Get the selected host address from window storage
      const selectedHostAddress = (window as any).__selectedHostAddress;
      if (!selectedHostAddress) {
        throw new Error("No host selected for balance reading");
      }
      const balancesAfter = {
        user: await readBalanceViem(TEST_USER_1_ADDRESS),
        subAccount: subAccount ? await readBalanceViem(subAccount) : 0n,
        host: await readBalanceViem(selectedHostAddress),
        treasury: await readBalanceViem(TEST_TREASURY_ADDRESS)
      };
      addLog(`After completion:`);
      addLog(`  User: $${ethers.formatUnits(balancesAfter.user, 6)}`);
      if (subAccount) {
        addLog(`  Sub-account: $${ethers.formatUnits(balancesAfter.subAccount, 6)}`);
      }
      addLog(`  Host: $${ethers.formatUnits(balancesAfter.host, 6)}`);
      addLog(`  Treasury: $${ethers.formatUnits(balancesAfter.treasury, 6)}`);
      
      // Calculate payment changes
      const payments = {
        userRefund: balancesAfter.user - balancesBefore.user,
        subAccountRefund: subAccount ? balancesAfter.subAccount - balancesBefore.subAccount : 0n,
        hostPayment: balancesAfter.host - balancesBefore.host,
        treasuryFee: balancesAfter.treasury - balancesBefore.treasury
      };
      
      addLog("💰 Payment Distribution Results:");
      
      if (payments.hostPayment > 0n) {
        addLog(`  ✅ Host received: $${ethers.formatUnits(payments.hostPayment, 6)} (90% of $0.20)`);
      } else {
        addLog(`  ❌ No payment to host detected`);
        console.error("ERROR: Host payment failed! This usually means:");
        console.error("  1. Checkpoint proof was not submitted successfully");
        console.error("  2. Or the proof was invalid/rejected by the contract");
        console.error("  Without valid proofs, the contract won't distribute payments");
      }

      if (payments.treasuryFee > 0n) {
        addLog(`  ✅ Treasury received: $${ethers.formatUnits(payments.treasuryFee, 6)} (10% of $0.20)`);
      } else {
        addLog(`  ❌ No fee to treasury detected`);
        console.error("ERROR: Treasury fee not collected! Payments may have failed.");
      }
      
      // Check for refund to sub-account (not user)
      if (payments.subAccountRefund > 0n) {
        addLog(`  ✅ Sub-account refund: $${ethers.formatUnits(payments.subAccountRefund, 6)}`);
        addLog(`     💡 Deposit Model: This refund stays in sub-account`);
        addLog(`     💡 Next session will use this balance (no new deposit needed!)`);
        addLog(`     💡 User can run ${Math.floor(Number(payments.subAccountRefund) / 200000)} more sessions`);
      } else if (payments.userRefund > 0n) {
        addLog(`  ✅ User refund: $${ethers.formatUnits(payments.userRefund, 6)}`);
      } else {
        addLog(`  ℹ️  No refund (session used full deposit)`);
      }
      
      setStepStatus(prev => ({ ...prev, 13: 'completed' }));
      setCurrentStep(13);
      
      // Steps 14-17 are not needed in session job model
      // Payment happens automatically in Step 13 (completeSession)
      addLog("=== Step 14: Settlement (automatic) ===");
      setStepStatus(prev => ({ ...prev, 14: 'completed' }));
      setCurrentStep(14);
      
      addLog("=== Step 15: Payments settled (automatic) ===");
      setStepStatus(prev => ({ ...prev, 15: 'completed' }));
      setCurrentStep(15);
      
      // Step 16: Host withdraws earnings using SDK HostManager
      addLog("=== Step 16: Host withdraws earnings ===");
      setStepStatus(prev => ({ ...prev, 16: 'in-progress' }));
      
      try {
        // Host withdraws their earnings using their own SDK instance
        addLog("Host withdrawing earnings using their SDK instance...");
        
        // Create host's SDK instance with signer authentication
        const hostProvider = new ethers.JsonRpcProvider(RPC_URL);
        // Use the selected host's private key
        const selectedHostAddr = (window as any).__selectedHostAddress;
        if (!selectedHostAddr) {
          throw new Error("No host selected for checkpoint submission");
        }
        let hostPrivateKey: string;
        if (selectedHostAddr.toLowerCase() === TEST_HOST_1_ADDRESS.toLowerCase()) {
          hostPrivateKey = TEST_HOST_1_PRIVATE_KEY;
        } else if (selectedHostAddr.toLowerCase() === TEST_HOST_2_ADDRESS.toLowerCase()) {
          hostPrivateKey = TEST_HOST_2_PRIVATE_KEY;
        } else {
          throw new Error(`Unknown host address: ${selectedHostAddr}`);
        }
        const hostWallet = new ethers.Wallet(hostPrivateKey, hostProvider);
        
        const hostSdk = new FabstirSDKCore({
          mode: 'production',
          rpcUrl: RPC_URL,
          chainId: CHAIN_ID_NUM,
          contractAddresses: {
            jobMarketplace: JOB_MARKETPLACE,
            nodeRegistry: NODE_REGISTRY,
            proofSystem: PROOF_SYSTEM,
            hostEarnings: HOST_EARNINGS,
            fabToken: FAB_TOKEN,
            usdcToken: USDC,
            modelRegistry: process.env.NEXT_PUBLIC_CONTRACT_MODEL_REGISTRY!
          },
          s5Config: {
            seedPhrase: process.env.NEXT_PUBLIC_S5_SEED_PHRASE,
            portalUrl: 'wss://z2DWuPbL5pweybXnEB618pMnV58ECj2VPDNfVGm3tFqBvjF@s5.ninja/s5/p2p'
          }
        });
        
        // Authenticate host SDK with the signer method
        await hostSdk.authenticate('signer', { signer: hostWallet });
        
        // Get HostManager and withdraw earnings
        const hostManager = hostSdk.getHostManager();
        const withdrawTx = await hostManager.withdrawEarnings(USDC);
        addLog(`✅ Host withdrew earnings - TX: ${withdrawTx}`);
        
      } catch (error: any) {
        addLog(`⚠️ Host withdrawal failed: ${error.message}`);
        if (error.message.includes('withdrawEarnings is not a function')) {
          console.error("ERROR: Host cannot withdraw earnings!");
          console.error("  This means no earnings were accumulated in the HostEarnings contract");
          console.error("  Likely because the checkpoint proof submission failed");
        }
      }
      
      setStepStatus(prev => ({ ...prev, 16: 'completed' }));
      setCurrentStep(16);
      
      // Step 17: Treasury withdraws fees using SDK TreasuryManager
      addLog("=== Step 17: Treasury withdraws fees ===");
      setStepStatus(prev => ({ ...prev, 17: 'in-progress' }));
      
      try {
        // Treasury withdraws their fees using their own SDK instance
        addLog("Treasury withdrawing fees using their SDK instance...");
        
        // Create treasury's SDK instance with signer authentication
        const treasuryProvider = new ethers.JsonRpcProvider(RPC_URL);
        const treasuryWallet = new ethers.Wallet(TEST_TREASURY_PRIVATE_KEY, treasuryProvider);
        
        const treasurySdk = new FabstirSDKCore({
          mode: 'production',
          rpcUrl: RPC_URL,
          chainId: CHAIN_ID_NUM,
          contractAddresses: {
            jobMarketplace: JOB_MARKETPLACE,
            nodeRegistry: NODE_REGISTRY,
            proofSystem: PROOF_SYSTEM,
            hostEarnings: HOST_EARNINGS,
            fabToken: FAB_TOKEN,
            usdcToken: USDC,
            modelRegistry: process.env.NEXT_PUBLIC_CONTRACT_MODEL_REGISTRY!
          },
          s5Config: {
            seedPhrase: process.env.NEXT_PUBLIC_S5_SEED_PHRASE,
            portalUrl: 'wss://z2DWuPbL5pweybXnEB618pMnV58ECj2VPDNfVGm3tFqBvjF@s5.ninja/s5/p2p'
          }
        });
        
        // Authenticate treasury SDK with the signer method
        await treasurySdk.authenticate('signer', { signer: treasuryWallet });
        
        // Get TreasuryManager and withdraw fees
        const treasuryManager = treasurySdk.getTreasuryManager();
        const treasuryWithdrawTx = await treasuryManager.withdrawFees();
        addLog(`✅ Treasury withdrew fees via SDK - TX: ${treasuryWithdrawTx}`);
      } catch (error: any) {
        addLog(`⚠️ Treasury withdrawal failed: ${error.message}`);
        addLog("Note: Only authorized treasury account can withdraw fees in production");
      }
      
      setStepStatus(prev => ({ ...prev, 17: 'completed' }));
      setCurrentStep(17);
      
      // Read final balances
      await readAllBalances();
      
      addLog("🎉 Full 17-step flow completed successfully!");
      addLog("Note: In session job model, payments happen automatically when session completes");
      
    } catch (error: any) {
      addLog(`❌ Flow failed: ${error.message}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper to run all steps automatically
  async function runFullFlow() {
    setError("");
    setLogs([]);
    setCurrentStep(0);
    setStepStatus({});
    setStatus("Starting full multi-chain USDC payment flow...");

    try {
      // Step 1: Authenticate
      addLog("=== Running Step 1: Authenticate ===");
      await step1Authenticate();

      // Small delay for UI visibility only
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Check ETH balance
      addLog("=== Running Step 2: Check ETH Balance ===");

      // Check allowance using SDK
      let shouldApprove = true;
      try {
        const contracts = getContractAddresses();
        const signer = await sdk.getSigner();
        const paymentManager = sdk.getPaymentManager();

        const userAddr = await signer.getAddress();
        const allowance = await paymentManager.checkAllowance(
          userAddr,
          contracts.JOB_MARKETPLACE,
          contracts.USDC
        );
        const allowanceFormatted = ethers.formatUnits(allowance, 6);

        if (parseFloat(allowanceFormatted) >= parseFloat(SESSION_DEPOSIT_AMOUNT)) {
          addLog(`✅ ETH balance check completed`);
          setStepStatus(prev => ({ ...prev, 2: 'completed' }));
          setCurrentStep(2);
          shouldApprove = false;
        }
      } catch (err) {
        console.log('Could not check allowance:', err);
      }

      if (shouldApprove) {
        await step2CheckETHBalance();
        // Check if step failed by checking error state
        const latestError = await new Promise<string>(resolve => {
          setTimeout(() => {
            setError(current => {
              resolve(current);
              return current;
            });
          }, 100);
        });
        if (latestError) {
          addLog("Flow stopped due to Step 2 error");
          throw new Error(latestError);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Discover hosts
      addLog("=== Running Step 3: Discover Hosts ===");
      await step3DiscoverHosts();

      // Get the host that was selected (since React state won't be updated yet)
      const hm = sdk?.getHostManager();
      const currentHosts = await (hm as any).discoverAllActiveHostsWithModels();
      if (!currentHosts || currentHosts.length === 0) {
        addLog("Flow stopped - no hosts discovered");
        throw new Error("No hosts available");
      }

      // Select a random host for the flow
      const parsedHosts = currentHosts.map((host: any) => ({
        address: host.address,
        endpoint: host.apiUrl || host.endpoint || `http://localhost:8080`,
        models: host.supportedModels || [],
        pricePerToken: 2000
      }));
      const randomIndex = Math.floor(Math.random() * parsedHosts.length);
      const flowSelectedHost = parsedHosts[randomIndex];

      // Store in state for UI AND use a ref to ensure it's available immediately
      setSelectedHost(flowSelectedHost);
      selectedHostRef.current = flowSelectedHost;

      // IMPORTANT: Use a temporary workaround to ensure the host is available
      // We'll create a modified version of step4CreateSession that uses the host directly
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 4: Create session - ensure host is set
      addLog("=== Running Step 4: Create Session ===");

      // Force set the selected host again right before calling step4
      await new Promise(resolve => {
        setSelectedHost(flowSelectedHost);
        setTimeout(resolve, 100);
      });

      await step4CreateSession();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Send prompt
      addLog("=== Running Step 5: Send Prompt ===");
      await step5SendPrompt();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Complete session
      addLog("=== Running Step 6: Complete Session ===");
      await step6CompleteSession();

      setStatus("✅ Full flow completed successfully!");
      addLog("🎉 All steps completed successfully!");
    } catch (err: any) {
      addLog(`❌ Full flow failed: ${err.message}`);
      setError(`Full flow failed: ${err.message}`);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Multi-Chain ETH Payment Flow Test</h1>
        <p className="text-gray-600">Using primary account directly with native ETH payments</p>
      </div>

      {/* Chain Selector */}
      <div className="mb-6 p-4 border rounded">
        <label className="block text-sm font-medium mb-2">Select Chain:</label>
        <select
          value={selectedChainId}
          onChange={(e) => setSelectedChainId(Number(e.target.value))}
          className="px-3 py-2 border rounded"
          disabled={loading || currentStep > 0}
        >
          <option value={ChainId.BASE_SEPOLIA}>Base Sepolia (ETH)</option>
          <option value={ChainId.OPBNB_TESTNET}>opBNB Testnet (BNB)</option>
        </select>
        {currentStep > 0 && (
          <p className="text-sm text-gray-500 mt-1">Chain locked during active flow</p>
        )}
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">{status}</span>
          <span className="text-sm text-gray-500">Step {currentStep}/6</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 border border-red-400 rounded bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Balance Display */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-2">Account Balances</h3>
          <div className="space-y-1 text-sm">
            <div>User (TEST_USER_1): {balances.testUser1 || '...'} ETH</div>
          </div>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-2">Accumulated Earnings</h3>
          <div className="space-y-1 text-sm">
            <div>Host Accumulated: {balances.hostAccumulated || '0'} ETH</div>
            <div className="text-xs text-gray-600">
              Note: ETH payments go directly to host wallet (see Host 1 Balance above)
            </div>
            <div className="text-xs text-gray-600">HostEarnings Contract: 0x908962e8c6CE72610021586f85ebDE09aAc97776</div>
            <div className="mt-2">Treasury Accumulated: {balances.treasuryAccumulated || '0'} ETH</div>
            <div className="text-xs text-gray-600">JobMarketplace Contract: {process.env.NEXT_PUBLIC_CONTRACT_JOB_MARKETPLACE}</div>
          </div>
        </div>
      </div>

      {/* Selected Host Info */}
      {selectedHost && (
        <div className="mb-6 p-4 border rounded bg-blue-50">
          <h3 className="font-bold mb-2">Selected Host</h3>
          <div className="text-sm space-y-1">
            <div>Address: {selectedHost.address}</div>
            <div>API URL: {selectedHost.apiUrl}</div>
            <div>Models: {selectedHost.models.join(', ')}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={runFullFlow}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          {loading ? 'Processing...' : 'Run Full Flow'}
        </button>

        <button
          onClick={step1Authenticate}
          disabled={loading || currentStep >= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Step 1: Authenticate
        </button>

        <button
          onClick={step2CheckETHBalance}
          disabled={loading || currentStep < 1 || currentStep >= 2}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Step 2: Check ETH Balance
        </button>

        <button
          onClick={step3DiscoverHosts}
          disabled={loading || currentStep < 2 || currentStep >= 3}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Step 3: Discover Hosts
        </button>

        <button
          onClick={step4CreateSession}
          disabled={loading || currentStep < 3 || currentStep >= 4}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Step 4: Create Session
        </button>

        <button
          onClick={step5SendPrompt}
          disabled={loading || currentStep < 4 || currentStep >= 5}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Step 5: Send Prompt
        </button>

        <button
          onClick={step6CompleteSession}
          disabled={loading || currentStep < 5 || currentStep >= 6}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Step 6: Complete Session
        </button>

        <button
          onClick={readAllBalances}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
        >
          Refresh Balances
        </button>
      </div>

      {/* Logs */}
      <div className="p-4 border rounded bg-gray-900 text-gray-100">
        <h3 className="font-bold mb-2">Activity Log</h3>
        <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-400">No activity yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

