export interface ParsedHost {
  address: string;
  endpoint: string;
  models: string[];
  stake: bigint;
  minPricePerTokenNative: bigint;  // ETH/BNB pricing in wei (18 decimals)
  minPricePerTokenStable: bigint;  // USDC pricing (6 decimals)
}

/**
 * Helper type for displaying host pricing in formatted strings
 */
export interface HostPricing {
  usdcPerToken: string;  // Formatted: "0.000316"
  ethPerToken: string;   // Formatted: "0.00001136"
  usdcRaw: bigint;       // Raw: 316n
  ethRaw: bigint;        // Raw: 11363636363636n
}
