'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StorageManager } from '@fabstir/sdk-core';
import type { UserSettings, PartialUserSettings, UserSettingsVersion } from '@fabstir/sdk-core';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (partial: PartialUserSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

/**
 * Custom hook for managing user settings with S5 storage
 *
 * Features:
 * - Loads settings on mount (returns null for first-time users)
 * - **Optimistic UI updates** - instant feedback, background saves
 * - Auto-saves settings to S5 decentralized storage
 * - 5-minute cache with TTL
 * - Cross-device sync via S5
 * - Graceful offline degradation (eventual consistency)
 * - No loading spinners for settings updates
 *
 * @param storageManager - SDK StorageManager instance
 * @returns Settings state and management functions
 */
export function useUserSettings(storageManager: StorageManager | null): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user settings from S5 storage
   * Returns null for first-time users
   */
  const loadSettings = useCallback(async () => {
    if (!storageManager) {
      console.warn('[useUserSettings] StorageManager not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userSettings = await storageManager.getUserSettings();

      if (userSettings === null) {
        // First-time user - no settings exist
        console.log('[useUserSettings] First-time user detected (no settings found)');
      } else {
        console.log('[useUserSettings] Settings loaded:', userSettings);
      }

      setSettings(userSettings);
    } catch (err: any) {
      console.error('[useUserSettings] Failed to load settings:', err);
      setError(err.message || 'Failed to load settings');

      // Graceful degradation - continue with null settings
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  /**
   * Update specific user settings (partial update)
   *
   * **Optimistic UI Pattern:**
   * 1. Updates local state IMMEDIATELY (synchronous via setState)
   * 2. UI re-renders instantly with new values
   * 3. Saves to S5 decentralized storage in background (async)
   * 4. On error: logs warning but DOES NOT revert (eventual consistency)
   *
   * This pattern ensures:
   * - UI feels instant and responsive (no loading spinners)
   * - Settings persist across devices via S5
   * - Graceful degradation if S5 is temporarily unavailable
   *
   * @param partial - Partial settings object to update
   * @returns Promise that resolves when S5 save completes (or fails gracefully)
   */
  const updateSettings = useCallback(async (partial: PartialUserSettings) => {
    if (!storageManager) {
      console.warn('[useUserSettings] Cannot update - StorageManager not available');
      return;
    }

    try {
      // Step 1: Optimistic update - update local state IMMEDIATELY (synchronous)
      // This causes React to re-render, updating the UI instantly
      setSettings(prev => {
        if (!prev) {
          // If no settings exist, create new settings object
          return {
            version: 1 as UserSettingsVersion,
            lastUpdated: Date.now(),
            selectedModel: '',
            ...partial
          };
        }

        return {
          ...prev,
          ...partial,
          lastUpdated: Date.now()
        };
      });

      // Step 2: Save to S5 in background (async, doesn't block UI)
      await storageManager.updateUserSettings(partial);
      console.log('[useUserSettings] Settings updated successfully:', partial);
    } catch (err: any) {
      console.error('[useUserSettings] Failed to update settings:', err);

      // Step 3: On error - DON'T revert optimistic update (eventual consistency)
      // The UI has already updated, user saw instant feedback
      // S5 will sync when connection is restored
      setError(err.message || 'Failed to update settings');

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [storageManager]);

  /**
   * Clear all user settings
   * Useful for "Reset Preferences" functionality
   */
  const resetSettings = useCallback(async () => {
    if (!storageManager) {
      console.warn('[useUserSettings] Cannot reset - StorageManager not available');
      return;
    }

    try {
      await storageManager.clearUserSettings();
      setSettings(null);
      setError(null);
      console.log('[useUserSettings] Settings cleared successfully');
    } catch (err: any) {
      console.error('[useUserSettings] Failed to reset settings:', err);
      setError(err.message || 'Failed to reset settings');
      throw err; // Re-throw so caller can handle
    }
  }, [storageManager]);

  /**
   * Refresh settings from S5 (bypasses cache)
   * Useful for manual sync or debugging
   */
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    refreshSettings
  };
}
