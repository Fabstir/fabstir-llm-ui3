// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

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
    minPricePerTokenNative: BigInt("11363636363636"),  // ~0.0000114 ETH/token (~$0.05 @ $4400 ETH)
    minPricePerTokenStable: BigInt(316)  // 0.000316 USDC/token
  },
  {
    address: "0x456...def",
    endpoint: "ws://localhost:8081",
    models: ["llama-3.2-1b-instruct"],
    stake: BigInt("500000000000000000"), // 0.5 FAB
    minPricePerTokenNative: BigInt("11363636363636"),  // ~0.0000114 ETH/token
    minPricePerTokenStable: BigInt(316)  // 0.000316 USDC/token
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
      console.log('[Query Function] Discovery started');
      console.log('[Query Function] IS_MOCK_MODE:', IS_MOCK_MODE);
      console.log('[Query Function] hostManager available:', !!hostManager);

      // Mock mode: Return mock hosts immediately
      if (IS_MOCK_MODE) {
        console.log("Mock: Discovering hosts");
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
        return MOCK_HOSTS;
      }

      // Production mode: Use SDK
      if (!hostManager) {
        console.error('[Query Function] Host manager NOT initialized - throwing error');
        throw new Error("Host manager not initialized");
      }

      console.log('[Query Function] Calling hostManager.discoverAllActiveHostsWithModels()...');

      let hosts;
      try {
        hosts = await hostManager.discoverAllActiveHostsWithModels();
        console.log('[Query Function] SDK returned:', hosts?.length || 0, 'hosts');
        console.log('[Query Function] Raw hosts data:', hosts);

        // Enhanced debug logging as requested by SDK developer
        console.log('[DEBUG] SDK returned:', hosts.length, 'hosts');
        console.log('[DEBUG] Raw hosts:', JSON.stringify(hosts, (k, v) =>
          typeof v === 'bigint' ? v.toString() : v, 2
        ));
      } catch (sdkError) {
        console.error('[Query Function] SDK discovery failed:', sdkError);
        throw sdkError;
      }

      // Parse hosts and fetch detailed status (including stake) for each
      const parsedHostsPromises = hosts
        .filter((host: any) => {
          const hasModels = (host.supportedModels || []).length > 0;
          const hasEndpoint = !!(host.apiUrl || host.endpoint);
          console.log('[Filter] Host', host.address, '- hasModels:', hasModels, 'hasEndpoint:', hasEndpoint);
          return hasModels && hasEndpoint;
        })
        .map(async (host: any) => {
          try {
            // Get detailed host status to retrieve stake information
            console.log('[Parse] Getting status for host:', host.address);
            const hostStatus = await hostManager.getHostStatus(host.address);

            return {
              address: host.address,
              endpoint: host.apiUrl || host.endpoint || "",
              models: host.supportedModels || [],
              stake: hostStatus.stake || BigInt(0),
              minPricePerTokenNative: host.minPricePerTokenNative || BigInt(0),  // ETH/BNB pricing
              minPricePerTokenStable: host.minPricePerTokenStable || BigInt(316), // USDC pricing with fallback
            };
          } catch (error) {
            console.warn(`[Parse] Failed to get status for host ${host.address}:`, error);
            // Fallback to host data without stake
            return {
              address: host.address,
              endpoint: host.apiUrl || host.endpoint || "",
              models: host.supportedModels || [],
              stake: host.stake || BigInt(0),
              minPricePerTokenNative: host.minPricePerTokenNative || BigInt(0),  // ETH/BNB pricing
              minPricePerTokenStable: host.minPricePerTokenStable || BigInt(316), // USDC pricing with fallback
            };
          }
        });

      console.log('[Query Function] Parsing', parsedHostsPromises.length, 'hosts...');
      const parsedHosts = await Promise.all(parsedHostsPromises);

      // Log discovered hosts for debugging endpoint/address matching
      console.log("🔍 Discovered Hosts:");
      parsedHosts.forEach((host, idx) => {
        console.log(`  Host ${idx + 1}:`);
        console.log(`    Address: ${host.address}`);
        console.log(`    Endpoint: ${host.endpoint}`);
        console.log(`    Models: ${host.models.join(", ")}`);
        console.log(`    USDC Price: ${(Number(host.minPricePerTokenStable) / 1_000_000).toFixed(6)} USDC/token`);
        console.log(`    ETH Price: ${(Number(host.minPricePerTokenNative) / 1e18).toFixed(8)} ETH/token`);
        console.log(`    Stake: ${(Number(host.stake) / 1e18).toFixed(2)} FAB`);
      });

      return parsedHosts;
    },
    enabled: false, // Manual trigger only via refetchHosts()
    staleTime: 30000, // Cache for 30 seconds
  });

  // Auto-select random host when hosts are discovered
  const handleDiscoverHosts = async () => {
    console.log('[Discover Hosts] Starting discovery...');
    console.log('[Discover Hosts] HostManager available:', !!hostManager);

    try {
      const result = await refetchHosts();
      console.log('[Discover Hosts] Discovery result:', {
        success: !!result.data,
        count: result.data?.length || 0,
        error: result.error
      });

      if (result.data && result.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * result.data.length);
        setSelectedHost(result.data[randomIndex]);
        console.log(`🎲 Randomly selected host ${randomIndex + 1} of ${result.data.length}: ${result.data[randomIndex].address}`);
        console.log(`ℹ️  Random selection not saved to S5 - promotes decentralization`);
      }
    } catch (error) {
      console.error('[Discover Hosts] Discovery failed:', error);
      throw error;
    }
  };

  // Smart host selection based on model
  const selectHostForModel = async (modelId: string): Promise<ParsedHost | null> => {
    console.log(`[Smart Host Selection] Finding host for model preference: ${modelId}`);

    // Discover hosts if not already discovered
    const hosts = availableHosts?.length > 0 ? availableHosts : (await refetchHosts()).data || [];

    if (hosts.length === 0) {
      console.error("[Smart Host Selection] No hosts discovered");
      return null;
    }

    // Filter hosts that have models registered (hosts advertise models by CID, not filename)
    // For now, select from any host with models until ModelRegistry integration is added
    const compatibleHosts = hosts.filter(host => host.models && host.models.length > 0);

    console.log(`[Smart Host Selection] Found ${compatibleHosts.length} hosts with models out of ${hosts.length}`);

    if (compatibleHosts.length === 0) {
      console.error(`[Smart Host Selection] No hosts with registered models found`);
      return null;
    }

    // Randomly select from compatible hosts
    const randomIndex = Math.floor(Math.random() * compatibleHosts.length);
    const selected = compatibleHosts[randomIndex];

    console.log(`[Smart Host Selection] Selected host ${randomIndex + 1} of ${compatibleHosts.length}:`, {
      address: selected.address,
      endpoint: selected.endpoint,
      models: selected.models.length > 0 ? `${selected.models.length} models` : 'no models',
    });

    setSelectedHost(selected);

    // Track analytics for auto-selection (no PII - just model ID)
    analytics.hostAutoSelected(modelId);

    return selected;
  };

  // Price filtering utility - filter hosts by max USDC price
  const filterByMaxPrice = (maxPrice: bigint): ParsedHost[] => {
    if (!availableHosts) return [];
    return availableHosts.filter(host => host.minPricePerTokenStable <= maxPrice);
  };

  // Price sorting utility - sort hosts by USDC price (lowest first)
  const sortByPrice = (hosts?: ParsedHost[]): ParsedHost[] => {
    const hostsToSort = hosts || availableHosts || [];
    return [...hostsToSort].sort((a, b) =>
      Number(a.minPricePerTokenStable - b.minPricePerTokenStable)
    );
  };

  // Restore host by address (from saved settings)
  const restoreHostByAddress = async (address: string): Promise<ParsedHost | null> => {
    console.log('[Restore Host] Attempting to restore host:', address);

    // Check if already in available hosts
    const existingHost = availableHosts?.find(h => h.address.toLowerCase() === address.toLowerCase());
    if (existingHost) {
      console.log('[Restore Host] Found in cached hosts');
      setSelectedHost(existingHost);
      return existingHost;
    }

    // Need to discover hosts to find it
    console.log('[Restore Host] Not in cache, discovering hosts...');
    try {
      const result = await refetchHosts();
      const foundHost = result.data?.find(h => h.address.toLowerCase() === address.toLowerCase());

      if (foundHost) {
        console.log('[Restore Host] Found after discovery');
        setSelectedHost(foundHost);
        return foundHost;
      } else {
        console.warn('[Restore Host] Host not found on network:', address);
        return null;
      }
    } catch (error) {
      console.error('[Restore Host] Failed to discover hosts:', error);
      return null;
    }
  };

  return {
    availableHosts: availableHosts || [],
    selectedHost,
    setSelectedHost,
    isDiscoveringHosts,
    discoverHosts: handleDiscoverHosts,
    selectHostForModel,
    refetchHosts,
    restoreHostByAddress,  // NEW: Restore saved host
    error,
    filterByMaxPrice,  // NEW: Filter hosts by max USDC price
    sortByPrice,       // NEW: Sort hosts by USDC price
  };
}
