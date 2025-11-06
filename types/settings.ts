// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

/**
 * Extended UserSettings type for fabstir-llm-ui3
 *
 * Extends the base UserSettings from SDK with additional UI-specific properties
 * that are not yet part of the SDK type definition.
 */

import type { UserSettings as SDKUserSettings, PartialUserSettings as SDKPartialUserSettings, UserSettingsVersion } from '@fabstir/sdk-core';

/**
 * Extended UserSettings with UI-specific properties
 */
export interface UserSettings extends SDKUserSettings {
  /**
   * User's preferred wallet connection type
   * - 'base-account': Use Base Account Kit (popup-free transactions)
   * - 'regular-wallet': Use standard wallet connection (MetaMask, etc.)
   */
  preferredWalletType?: 'base-account' | 'regular-wallet';
}

/**
 * Extended PartialUserSettings for updates
 */
export type PartialUserSettings = Partial<Omit<UserSettings, 'version' | 'lastUpdated'>>;

// Re-export UserSettingsVersion for convenience
export type { UserSettingsVersion };
