// Chain configuration
export const CHAIN_ID = {
  BASE_SEPOLIA: 84532,
} as const;

export const DEFAULT_CHAIN_ID = CHAIN_ID.BASE_SEPOLIA;

// Session defaults
export const SESSION_DEFAULTS = {
  DEPOSIT_AMOUNT_USDC: "2.00", // $2.00 USDC
  DEPOSIT_AMOUNT_ETH: "0.0006", // ~$2.40 ETH
  PRICE_PER_TOKEN_USDC: 2000, // tokens per USDC
  PRICE_PER_TOKEN_ETH: 5000, // wei per token
  PROOF_INTERVAL: 100, // tokens
  DURATION: 86400, // 1 day in seconds
} as const;

// Payment split
export const PAYMENT_SPLIT = {
  HOST: 0.9, // 90% to host
  TREASURY: 0.1, // 10% to treasury
} as const;

// Contract addresses - Retrieved from SDK ChainRegistry
// DO NOT hardcode addresses here - use SDK's getContractAddress() method
export const CONTRACT_NAMES = {
  JOB_MARKETPLACE: "JOB_MARKETPLACE",
  NODE_REGISTRY: "NODE_REGISTRY",
  PROOF_SYSTEM: "PROOF_SYSTEM",
  HOST_EARNINGS: "HOST_EARNINGS",
  MODEL_REGISTRY: "MODEL_REGISTRY",
  USDC_TOKEN: "USDC_TOKEN",
  FAB_TOKEN: "FAB_TOKEN",
  SPEND_PERMISSION_MANAGER: "SPEND_PERMISSION_MANAGER",
} as const;

// RPC URLs
export const RPC_URLS = {
  BASE_SEPOLIA:
    process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA ||
    "https://base-sepolia.g.alchemy.com/v2/1pZoccdtgU8CMyxXzE3l_ghnBBaJABMR",
} as const;

// S5 Portal
export const S5_PORTAL_URL =
  process.env.NEXT_PUBLIC_S5_PORTAL_URL ||
  "wss://z2DWuPbL5pweybXnEB618pMnV58ECj2VPDNfVGm3tFqBvjF@s5.ninja/s5/p2p";

// Mock mode configuration
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
export const MOCK_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_MOCK_WALLET_ADDRESS ||
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7";
