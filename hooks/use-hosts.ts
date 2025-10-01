"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ParsedHost } from "@/types/host";
import { IS_MOCK_MODE, MOCK_WALLET_ADDRESS } from "@/lib/constants";

type HostManager = any; // Type from SDK

// Mock hosts for UI development (same as in use-fabstir-sdk)
const MOCK_HOSTS: ParsedHost[] = [
  {
    address: "0x123...abc",
    endpoint: "ws://localhost:8080",
    models: ["llama-3.1-8b", "mistral-7b"],
    stake: BigInt("1000000000000000000"), // 1 FAB
  },
  {
    address: "0x456...def",
    endpoint: "ws://localhost:8081",
    models: ["llama-3.2-1b-instruct"],
    stake: BigInt("500000000000000000"), // 0.5 FAB
  },
];

export function useHosts(hostManager: HostManager | null) {
  const [selectedHost, setSelectedHost] = useState<ParsedHost | null>(null);

  const {
    data: availableHosts,
    isLoading: isDiscoveringHosts,
    refetch: refetchHosts,
    error,
  } = useQuery({
    queryKey: ["hosts"],
    queryFn: async () => {
      // Mock mode: Return mock hosts immediately
      if (IS_MOCK_MODE) {
        console.log("Mock: Discovering hosts");
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
        return MOCK_HOSTS;
      }

      // Production mode: Use SDK
      if (!hostManager) throw new Error("Host manager not initialized");

      const hosts = await hostManager.discoverAllActiveHostsWithModels();

      const parsedHosts: ParsedHost[] = hosts
        .map((host: any) => ({
          address: host.address,
          endpoint: host.apiUrl || host.endpoint || "",
          models: host.supportedModels || [],
          stake: host.stake || BigInt(0),
        }))
        .filter((h: ParsedHost) => h.models.length > 0 && h.endpoint);

      return parsedHosts;
    },
    enabled: false, // Manual trigger only via refetchHosts()
    staleTime: 30000, // Cache for 30 seconds
  });

  // Auto-select first host when hosts are discovered
  const handleDiscoverHosts = async () => {
    const result = await refetchHosts();
    if (result.data && result.data.length > 0 && !selectedHost) {
      setSelectedHost(result.data[0]);
    }
  };

  return {
    availableHosts: availableHosts || [],
    selectedHost,
    setSelectedHost,
    isDiscoveringHosts,
    discoverHosts: handleDiscoverHosts,
    refetchHosts,
    error,
  };
}
