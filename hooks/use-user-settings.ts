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
 * - Auto-saves settings to S5 decentralized storage
 * - 5-minute cache with TTL
 * - Cross-device sync
 * - Graceful offline degradation
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
   * Saves to S5 and updates local state optimistically
   */
  const updateSettings = useCallback(async (partial: PartialUserSettings) => {
    if (!storageManager) {
      console.warn('[useUserSettings] Cannot update - StorageManager not available');
      return;
    }

    try {
      // Optimistic update - update local state immediately
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

      // Save to S5 in background
      await storageManager.updateUserSettings(partial);
      console.log('[useUserSettings] Settings updated successfully:', partial);
    } catch (err: any) {
      console.error('[useUserSettings] Failed to update settings:', err);

      // Don't revert optimistic update - eventual consistency
      // Log error but don't block user
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
