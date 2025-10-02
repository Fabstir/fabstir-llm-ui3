"use client";

import { useQuery } from "@tanstack/react-query";
import { IS_MOCK_MODE } from "@/lib/constants";

// SDK types
type PaymentManager = any;

/**
 * Hook for polling wallet balances with auto-refresh
 */
export function useBalances(
  paymentManager: PaymentManager | null,
  userAddress: string | null
) {
  const {
    data: usdcBalance,
    isLoading: isLoadingUSDC,
    refetch: refetchUSDC,
  } = useQuery({
    queryKey: ["usdc-balance", userAddress],
    queryFn: async () => {
      // Mock mode: Return mock balance
      if (IS_MOCK_MODE) {
        console.log("Mock: Getting USDC balance");
        await new Promise((resolve) => setTimeout(resolve, 300));
        return "10.00"; // Mock $10 USDC
      }

      // Production mode: Use real SDK
      if (!paymentManager || !userAddress) {
        throw new Error("Payment manager or address not available");
      }

      const balance = await paymentManager.getUSDCBalance(userAddress);
      // Convert from wei to decimal (assuming 6 decimals for USDC)
      const balanceString = (Number(balance) / 1000000).toFixed(2);
      return balanceString;
    },
    enabled: !!paymentManager || IS_MOCK_MODE,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  const {
    data: ethBalance,
    isLoading: isLoadingETH,
    refetch: refetchETH,
  } = useQuery({
    queryKey: ["eth-balance", userAddress],
    queryFn: async () => {
      // Mock mode: Return mock balance
      if (IS_MOCK_MODE) {
        console.log("Mock: Getting ETH balance");
        await new Promise((resolve) => setTimeout(resolve, 300));
        return "0.5"; // Mock 0.5 ETH
      }

      // Production mode: Use real SDK
      if (!paymentManager || !userAddress) {
        throw new Error("Payment manager or address not available");
      }

      const balance = await paymentManager.getETHBalance(userAddress);
      // Convert from wei to decimal (18 decimals for ETH)
      const balanceString = (Number(balance) / 1e18).toFixed(4);
      return balanceString;
    },
    enabled: !!paymentManager || IS_MOCK_MODE,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });

  return {
    usdcBalance: usdcBalance || "0.00",
    ethBalance: ethBalance || "0.0000",
    isLoadingUSDC,
    isLoadingETH,
    refetchUSDC,
    refetchETH,
    isLoading: isLoadingUSDC || isLoadingETH,
  };
}

/**
 * Hook to check if user has sufficient balance for session
 * Checks the appropriate account based on Base Account vs EOA mode
 *
 * For Base Account: Checks SUB account + PRIMARY account combined balance
 * For EOA: Checks user's wallet balance
 */
export function useHasSufficientBalance(
  accountInfo: { primaryAccount?: string; subAccount?: string; isUsingBaseAccount?: boolean } | null,
  userAddress: string | null,
  minRequired: number = 2.0 // Default $2 USDC minimum
) {
  const {
    data: balance,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["sufficient-balance-check", accountInfo?.subAccount, accountInfo?.primaryAccount, userAddress],
    queryFn: async () => {
      const { ethers } = await import("ethers");
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA;
      const usdcAddress = process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN!;

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const usdcContract = new ethers.Contract(
        usdcAddress,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );

      if (accountInfo?.isUsingBaseAccount && accountInfo.subAccount && accountInfo.primaryAccount) {
        // Base Account Mode: Check SUB + PRIMARY combined balance
        const [subBal, primaryBal] = await Promise.all([
          usdcContract.balanceOf(accountInfo.subAccount),
          usdcContract.balanceOf(accountInfo.primaryAccount),
        ]);

        const subBalance = parseFloat(ethers.formatUnits(subBal, 6));
        const primaryBalance = parseFloat(ethers.formatUnits(primaryBal, 6));
        const totalBalance = subBalance + primaryBalance;

        console.log("💰 Balance Check (Base Account):");
        console.log(`  - SUB (${accountInfo.subAccount.slice(0, 10)}...): ${subBalance.toFixed(2)} USDC`);
        console.log(`  - PRIMARY (${accountInfo.primaryAccount.slice(0, 10)}...): ${primaryBalance.toFixed(2)} USDC`);
        console.log(`  - TOTAL: ${totalBalance.toFixed(2)} USDC (need ${minRequired} USDC)`);

        return {
          hasEnough: totalBalance >= minRequired,
          balance: totalBalance.toFixed(2),
          subBalance: subBalance.toFixed(2),
          primaryBalance: primaryBalance.toFixed(2),
          address: accountInfo.primaryAccount, // Show primary for deposit instructions
        };
      } else if (userAddress) {
        // EOA Mode: Check user's wallet
        const bal = await usdcContract.balanceOf(userAddress);
        const balanceFormatted = ethers.formatUnits(bal, 6);
        const hasEnough = parseFloat(balanceFormatted) >= minRequired;

        return {
          hasEnough,
          balance: balanceFormatted,
          subBalance: "0",
          primaryBalance: balanceFormatted,
          address: userAddress,
        };
      }

      return {
        hasEnough: false,
        balance: "0",
        subBalance: "0",
        primaryBalance: "0",
        address: null
      };
    },
    enabled: !!(accountInfo?.subAccount || accountInfo?.primaryAccount || userAddress),
    refetchInterval: 10000, // Check every 10 seconds
    staleTime: 5000,
  });

  return {
    hasEnough: balance?.hasEnough ?? false,
    balance: balance?.balance ?? "0",
    subBalance: balance?.subBalance ?? "0",
    primaryBalance: balance?.primaryBalance ?? "0",
    checkingAddress: balance?.address ?? null,
    isLoading,
    refetch,
  };
}
