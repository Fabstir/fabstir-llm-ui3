/**
 * Spend Permissions Utilities
 *
 * Manages spend permissions for popup-free transactions using Base Account Kit.
 *
 * Key Concepts:
 * - Spend Permission Manager (SPM): Base protocol contract at 0xf85210B21cC50302F477BA56686d2019dC9b67Ad
 * - Sub-accounts: Created with spend permissions for specific tokens
 * - Auto Spend Permissions: Allow transactions without popups after initial approval
 */

import type { Address } from "viem";

// SpendPermissionManager address (deployed on Base & Base Sepolia)
export const SPEND_PERMISSION_MANAGER = "0xf85210B21cC50302F477BA56686d2019dC9b67Ad" as Address;

export interface SpendPermission {
  account: Address;
  spender: Address;
  token: Address;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: `0x${string}`;
}

/**
 * Create spend permission parameters for wallet_addSubAccount
 */
export function createSpendPermissionParams(params: {
  token: Address;
  allowance: bigint;
  period: number;
  duration: number;
}): {
  account: { type: "create" };
  spender: {
    address: Address;
    token: Address;
    allowance: string;
    period: number;
    start: number;
    end: number;
  };
} {
  const now = Math.floor(Date.now() / 1000);

  return {
    account: { type: "create" },
    spender: {
      address: SPEND_PERMISSION_MANAGER,
      token: params.token,
      allowance: params.allowance.toString(),
      period: params.period,
      start: now,
      end: now + params.duration,
    },
  };
}

/**
 * Create wallet_sendCalls parameters for transactions
 */
export function createSendCallsParams(params: {
  from: Address;
  chainId: string;
  calls: Array<{
    to: Address;
    data: `0x${string}`;
    value?: bigint;
  }>;
}): {
  version: string;
  chainId: string;
  from: Address;
  calls: Array<{
    to: Address;
    data: `0x${string}`;
    value?: string;
  }>;
  capabilities: {
    atomic: { required: boolean };
  };
} {
  return {
    version: "2.0.0",
    chainId: params.chainId,
    from: params.from,
    calls: params.calls.map((call) => ({
      to: call.to,
      data: call.data,
      value: call.value?.toString(),
    })),
    capabilities: {
      atomic: { required: true },
    },
  };
}

/**
 * Check if a sub-account has spend permissions
 */
export async function hasSpendPermission(
  provider: any,
  subAccount: Address,
  token: Address
): Promise<boolean> {
  try {
    // This would require calling the SPM contract to check permissions
    // For now, we'll assume if sub-account exists, permissions exist
    // In production, implement proper permission checking
    return true;
  } catch (error) {
    console.error("Error checking spend permission:", error);
    return false;
  }
}

/**
 * Calculate default allowance for USDC spend permissions
 */
export function calculateDefaultAllowance(depositAmount: string): bigint {
  // Convert deposit amount to USDC (6 decimals)
  const amount = BigInt(Math.floor(parseFloat(depositAmount) * 1_000_000));

  // Add 50% buffer for fees and future sessions
  const buffer = amount / 2n;

  return amount + buffer;
}

/**
 * Get default permission parameters for a session
 */
export function getDefaultPermissionParams(params: {
  token: Address;
  depositAmount: string;
}) {
  const allowance = calculateDefaultAllowance(params.depositAmount);

  return {
    token: params.token,
    allowance,
    period: 86400, // 1 day in seconds
    duration: 86400 * 30, // 30 days total duration
  };
}
