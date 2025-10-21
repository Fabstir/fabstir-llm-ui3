// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

/**
 * SDK Factory - Automatic Mock/Production Mode Switching
 *
 * This factory function automatically returns either a MockSessionManager
 * or real SessionManager based on environment variables.
 *
 * Usage in your production UI app:
 *
 *   import { createSessionManager } from '@/lib/sdk/sdk-factory';
 *
 *   const sdk = new FabstirSDKCore({...});
 *   await sdk.authenticate(privateKey);
 *
 *   // Automatically uses mock or real based on env
 *   const sessionManager = await createSessionManager(sdk);
 *
 *   // Rest of your code stays the same!
 *   const { sessionId } = await sessionManager.startSession({...});
 *
 * Environment Variables:
 *   NEXT_PUBLIC_SDK_MODE=mock        → Use MockSessionManager
 *   NEXT_PUBLIC_SDK_MODE=production  → Use real SDK
 *
 * DevOps can switch modes by changing the environment variable in:
 * - Vercel: Project Settings → Environment Variables
 * - Netlify: Site Settings → Build & deploy → Environment
 * - Docker: Update .env file and restart container
 */

import { MockSessionManager } from './MockSessionManager';
import type { FabstirSDKCore } from '@fabstir/sdk-core';

/**
 * SDK Mode type
 */
export type SDKMode = 'mock' | 'production';

/**
 * Get current SDK mode from environment
 */
export function getSDKMode(): SDKMode {
  // Check Next.js public environment variable
  const mode = process.env.NEXT_PUBLIC_SDK_MODE?.toLowerCase();

  if (mode === 'mock') {
    return 'mock';
  }

  if (mode === 'production') {
    return 'production';
  }

  // Default to production if not specified
  console.warn('NEXT_PUBLIC_SDK_MODE not set, defaulting to production');
  return 'production';
}

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return getSDKMode() === 'mock';
}

/**
 * Create SessionManager (mock or real based on environment)
 *
 * @param sdk - FabstirSDKCore instance (required for production mode)
 * @returns SessionManager instance (mock or real)
 */
export async function createSessionManager(sdk?: FabstirSDKCore): Promise<any> {
  const mode = getSDKMode();

  if (mode === 'mock') {
    console.log('🎭 SDK Factory: Creating MockSessionManager');
    console.log('   To switch to production mode, set: NEXT_PUBLIC_SDK_MODE=production');
    return new MockSessionManager();
  }

  // Production mode - use real SDK
  if (!sdk) {
    throw new Error(
      'SDK instance required for production mode. ' +
      'Pass FabstirSDKCore instance to createSessionManager()'
    );
  }

  console.log('🚀 SDK Factory: Creating real SessionManager');
  console.log('   Mode: Production (connecting to real GPU nodes)');

  try {
    const sessionManager = await sdk.getSessionManager();
    return sessionManager;
  } catch (error) {
    console.error('❌ Failed to create real SessionManager:', error);

    // Option 1: Throw error (strict mode)
    throw new Error(
      `Failed to create production SessionManager: ${error}. ` +
      'If GPU nodes are not ready yet, set NEXT_PUBLIC_SDK_MODE=mock'
    );

    // Option 2: Graceful fallback to mock (uncomment if desired)
    // console.warn('⚠️  Falling back to mock mode due to error');
    // return new MockSessionManager();
  }
}

/**
 * Create HostManager (mock or real based on environment)
 *
 * In mock mode, returns a stub that provides fake host data.
 * In production mode, returns real HostManager from SDK.
 *
 * @param sdk - FabstirSDKCore instance (required for production mode)
 * @returns HostManager instance (mock or real)
 */
export async function createHostManager(sdk?: FabstirSDKCore): Promise<any> {
  const mode = getSDKMode();

  if (mode === 'mock') {
    console.log('🎭 SDK Factory: Creating Mock HostManager');

    // Return mock host manager with fake host data
    return {
      discoverAllActiveHostsWithModels: async () => {
        console.log('🎭 Mock: Discovering fake hosts');
        return [
          {
            address: '0x0000000000000000000000000000000000000001',
            apiUrl: 'http://mock-host-1.example.com:8083',
            stake: '1000',
            isActive: true,
            supportedModels: ['llama-3.1-8b', 'mistral-7b'],
            minPricePerToken: '2000',
            metadata: {
              hardware: { gpu: 'RTX 4090', vram: 24, ram: 64 },
              capabilities: ['llama', 'mistral'],
              location: 'US-East',
              costPerToken: 2000,
            },
          },
          {
            address: '0x0000000000000000000000000000000000000002',
            apiUrl: 'http://mock-host-2.example.com:8083',
            stake: '2000',
            isActive: true,
            supportedModels: ['llama-3.2-1b-instruct'],
            minPricePerToken: '1500',
            metadata: {
              hardware: { gpu: 'RTX 3090', vram: 24, ram: 32 },
              capabilities: ['llama'],
              location: 'EU-West',
              costPerToken: 1800,
            },
          },
        ];
      },
      getHostInfo: async (address: string) => {
        console.log(`🎭 Mock: Getting info for host ${address}`);
        return {
          address,
          apiUrl: 'http://mock-host.example.com:8083',
          stake: '1000',
          isActive: true,
          supportedModels: ['llama-3.1-8b'],
          minPricePerToken: '2000',
        };
      },
      getHostStatus: async () => ({ isActive: true }),
    };
  }

  // Production mode
  if (!sdk) {
    throw new Error('SDK instance required for production mode');
  }

  console.log('🚀 SDK Factory: Creating real HostManager');
  return sdk.getHostManager();
}

/**
 * Create PaymentManager (mock or real based on environment)
 *
 * @param sdk - FabstirSDKCore instance (required for production mode)
 * @returns PaymentManager instance (mock or real)
 */
export async function createPaymentManager(sdk?: FabstirSDKCore): Promise<any> {
  const mode = getSDKMode();

  if (mode === 'mock') {
    console.log('🎭 SDK Factory: Creating Mock PaymentManager');

    // Return mock payment manager
    return {
      getBalance: async (address: string, tokenAddress: string) => {
        console.log(`🎭 Mock: Getting balance for ${address}`);
        return BigInt(10000000); // 10 USDC
      },
      depositUSDC: async (tokenAddress: string, amount: string, chainId: number) => {
        console.log(`🎭 Mock: Depositing ${amount} USDC on chain ${chainId}`);
        return { hash: '0xmockhash123', wait: async () => {} };
      },
      depositNative: async (tokenAddress: string, amount: string, chainId: number) => {
        console.log(`🎭 Mock: Depositing ${amount} native token on chain ${chainId}`);
        return { hash: '0xmockhash456', wait: async () => {} };
      },
    };
  }

  // Production mode
  if (!sdk) {
    throw new Error('SDK instance required for production mode');
  }

  console.log('🚀 SDK Factory: Creating real PaymentManager');
  return sdk.getPaymentManager();
}

/**
 * Create StorageManager (mock or real based on environment)
 *
 * @param sdk - FabstirSDKCore instance (required for production mode)
 * @returns StorageManager instance (mock or real)
 */
export async function createStorageManager(sdk?: FabstirSDKCore): Promise<any> {
  const mode = getSDKMode();

  if (mode === 'mock') {
    console.log('🎭 SDK Factory: Creating Mock StorageManager');

    return {
      saveConversation: async (data: any) => {
        console.log('🎭 Mock: Saving conversation');
        return 'mock-cid-' + Date.now();
      },
      loadConversation: async (cid: string) => {
        console.log(`🎭 Mock: Loading conversation ${cid}`);
        return null;
      },
      getUserSettings: async () => {
        console.log('🎭 Mock: Getting user settings');
        // Return null for first-time user (no settings)
        // UI will use defaults and save to localStorage
        return null;
      },
      updateUserSettings: async (partial: any) => {
        console.log('🎭 Mock: Updating user settings:', partial);
        // In mock mode, settings are saved to localStorage by the hook
        return;
      },
      clearUserSettings: async () => {
        console.log('🎭 Mock: Clearing user settings');
        return;
      },
    };
  }

  // Production mode
  if (!sdk) {
    throw new Error('SDK instance required for production mode');
  }

  console.log('🚀 SDK Factory: Creating real StorageManager');
  return await sdk.getStorageManager();
}

/**
 * Create TreasuryManager (mock or real based on environment)
 *
 * @param sdk - FabstirSDKCore instance (required for production mode)
 * @returns TreasuryManager instance (mock or real)
 */
export async function createTreasuryManager(sdk?: FabstirSDKCore): Promise<any> {
  const mode = getSDKMode();

  if (mode === 'mock') {
    console.log('🎭 SDK Factory: Creating Mock TreasuryManager');

    return {
      getTreasuryBalance: async () => {
        console.log('🎭 Mock: Getting treasury balance');
        return BigInt(1000000);
      },
    };
  }

  // Production mode
  if (!sdk) {
    throw new Error('SDK instance required for production mode');
  }

  console.log('🚀 SDK Factory: Creating real TreasuryManager');
  return sdk.getTreasuryManager();
}

/**
 * Display current SDK configuration to console
 */
export function logSDKConfig(): void {
  const mode = getSDKMode();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         Fabstir SDK Configuration                   ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║ Mode:              ${mode === 'mock' ? '🎭 MOCK MODE' : '🚀 PRODUCTION MODE'}                 ║`);
  console.log(`║ Environment:       ${process.env.NODE_ENV || 'development'}                        ║`);
  console.log('╠══════════════════════════════════════════════════════╣');

  if (mode === 'mock') {
    console.log('║ ⚠️  WARNING: Using hardcoded responses              ║');
    console.log('║    Real GPU nodes are NOT being used                ║');
    console.log('║                                                      ║');
    console.log('║ To switch to production:                            ║');
    console.log('║    Set: NEXT_PUBLIC_SDK_MODE=production             ║');
  } else {
    console.log('║ ✅ Using real GPU nodes from blockchain             ║');
    console.log('║    Responses from actual AI inference               ║');
    console.log('║                                                      ║');
    console.log('║ To switch to mock (for testing):                    ║');
    console.log('║    Set: NEXT_PUBLIC_SDK_MODE=mock                   ║');
  }

  console.log('╚══════════════════════════════════════════════════════╝');
}
