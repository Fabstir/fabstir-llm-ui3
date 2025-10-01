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
