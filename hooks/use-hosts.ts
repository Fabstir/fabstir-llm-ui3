"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ParsedHost } from "@/types/host";
import { IS_MOCK_MODE, MOCK_WALLET_ADDRESS } from "@/lib/constants";
import { analytics } from "@/lib/analytics";

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

      // Parse hosts and fetch detailed status (including stake) for each
      const parsedHostsPromises = hosts
        .filter((host: any) =>
          (host.supportedModels || []).length > 0 &&
          (host.apiUrl || host.endpoint)
        )
        .map(async (host: any) => {
          try {
            // Get detailed host status to retrieve stake information
            const hostStatus = await hostManager.getHostStatus(host.address);

            return {
              address: host.address,
              endpoint: host.apiUrl || host.endpoint || "",
              models: host.supportedModels || [],
              stake: hostStatus.stake || BigInt(0),
            };
          } catch (error) {
            console.warn(`Failed to get status for host ${host.address}:`, error);
            // Fallback to host data without stake
            return {
              address: host.address,
              endpoint: host.apiUrl || host.endpoint || "",
              models: host.supportedModels || [],
              stake: host.stake || BigInt(0),
            };
          }
        });

      const parsedHosts = await Promise.all(parsedHostsPromises);

      // Log discovered hosts for debugging endpoint/address matching
      console.log("🔍 Discovered Hosts:");
      parsedHosts.forEach((host, idx) => {
        console.log(`  Host ${idx + 1}:`);
        console.log(`    Address: ${host.address}`);
        console.log(`    Endpoint: ${host.endpoint}`);
        console.log(`    Models: ${host.models.join(", ")}`);
        console.log(`    Stake: ${(Number(host.stake) / 1e18).toFixed(2)} FAB`);
      });

      return parsedHosts;
    },
    enabled: false, // Manual trigger only via refetchHosts()
    staleTime: 30000, // Cache for 30 seconds
  });

  // Auto-select random host when hosts are discovered
  const handleDiscoverHosts = async () => {
    const result = await refetchHosts();
    if (result.data && result.data.length > 0 && !selectedHost) {
      const randomIndex = Math.floor(Math.random() * result.data.length);
      setSelectedHost(result.data[randomIndex]);
      console.log(`🎲 Randomly selected host ${randomIndex + 1} of ${result.data.length}: ${result.data[randomIndex].address}`);
    }
  };

  // Smart host selection based on model
  const selectHostForModel = async (modelId: string): Promise<ParsedHost | null> => {
    console.log(`[Smart Host Selection] Finding host for model: ${modelId}`);

    // Discover hosts if not already discovered
    const hosts = availableHosts?.length > 0 ? availableHosts : (await refetchHosts()).data || [];

    if (hosts.length === 0) {
      console.error("[Smart Host Selection] No hosts discovered");
      return null;
    }

    // Filter hosts that support the selected model
    const compatibleHosts = hosts.filter(host =>
      host.models.some(model => model.includes(modelId) || modelId.includes(model))
    );

    console.log(`[Smart Host Selection] Found ${compatibleHosts.length} compatible hosts out of ${hosts.length}`);

    if (compatibleHosts.length === 0) {
      console.error(`[Smart Host Selection] No hosts support model: ${modelId}`);
      return null;
    }

    // Randomly select from compatible hosts
    const randomIndex = Math.floor(Math.random() * compatibleHosts.length);
    const selected = compatibleHosts[randomIndex];

    console.log(`[Smart Host Selection] Selected host ${randomIndex + 1} of ${compatibleHosts.length}:`, {
      address: selected.address,
      endpoint: selected.endpoint,
      models: selected.models,
    });

    setSelectedHost(selected);

    // Track analytics for auto-selection (no PII - just model ID)
    analytics.hostAutoSelected(modelId);

    return selected;
  };

  return {
    availableHosts: availableHosts || [],
    selectedHost,
    setSelectedHost,
    isDiscoveringHosts,
    discoverHosts: handleDiscoverHosts,
    selectHostForModel,
    refetchHosts,
    error,
  };
}
