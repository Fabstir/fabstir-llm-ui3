// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi-config";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { getSDKMode } from "@/lib/sdk/sdk-factory";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5000,
          },
        },
      })
  );

  const mode = getSDKMode();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {mode === 'mock' && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500 p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900">
                    Demo Mode: Using demonstration AI responses
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Real AI inference from decentralized GPU nodes will be available soon!
                  </p>
                </div>
                <div className="hidden sm:block px-3 py-1 bg-purple-200 rounded-full">
                  <span className="text-xs font-medium text-purple-900">MOCK MODE</span>
                </div>
              </div>
            </div>
          )}
          {children}
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
