'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StorageManager } from '@fabstir/sdk-core';
import type { UserSettings, PartialUserSettings, UserSettingsVersion } from '@fabstir/sdk-core';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  updateSettings: (partial: PartialUserSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

// localStorage cache configuration
const SETTINGS_CACHE_KEY = 'fabstir_user_settings_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (matches S5 cache)

/**
 * Cache settings to localStorage with timestamp
 */
function cacheSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
      data: settings,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn('[useUserSettings] Failed to cache settings to localStorage:', err);
  }
}

/**
 * Get cached settings from localStorage (with TTL check)
 */
function getCachedSettings(): UserSettings | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);

    // Check TTL - cache expires after 5 minutes
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(SETTINGS_CACHE_KEY);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[useUserSettings] Failed to read cached settings:', err);
    return null;
  }
}

/**
 * Check if error is network-related
 */
function isNetworkError(error: any): boolean {
  if (typeof window !== 'undefined' && !navigator.onLine) return true;

  return (
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('timeout') ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'ENOTFOUND'
  );
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
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<PartialUserSettings[]>([]);

  /**
   * Load user settings from S5 storage
   * Returns null for first-time users
   * Uses localStorage cache as fallback when S5 unavailable
   */
  const loadSettings = useCallback(async () => {
    if (!storageManager) {
      console.warn('[useUserSettings] StorageManager not available');
      // Try to load from localStorage cache
      const cached = getCachedSettings();
      if (cached) {
        console.log('[useUserSettings] Using cached settings (no StorageManager)');
        setSettings(cached);
      }
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
        console.log('[useUserSettings] Settings loaded from S5:', userSettings);
        // Cache to localStorage on successful load
        cacheSettings(userSettings);
      }

      setSettings(userSettings);
    } catch (err: any) {
      console.error('[useUserSettings] Failed to load settings from S5:', err);
      setError(err.message || 'Failed to load settings');

      // Try to use cached settings as fallback
      const cached = getCachedSettings();
      if (cached) {
        console.log('[useUserSettings] Using cached settings as fallback');
        setSettings(cached);
      } else {
        // Graceful degradation - continue with null settings
        setSettings(null);
      }
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
    // Step 1: Optimistic update - update local state IMMEDIATELY (synchronous)
    // This causes React to re-render, updating the UI instantly
    const updatedSettings = await new Promise<UserSettings>((resolve) => {
      setSettings(prev => {
        let newSettings: UserSettings;
        if (!prev) {
          // If no settings exist, create new settings object
          newSettings = {
            version: 1 as UserSettingsVersion,
            lastUpdated: Date.now(),
            selectedModel: '',
            ...partial
          };
        } else {
          newSettings = {
            ...prev,
            ...partial,
            lastUpdated: Date.now()
          };
        }
        resolve(newSettings);
        return newSettings;
      });
    });

    // Step 2: Save to persistent storage
    if (!storageManager) {
      // Fallback: Use localStorage when StorageManager not available (no wallet connected yet)
      console.warn('[useUserSettings] StorageManager not available - using localStorage fallback');
      cacheSettings(updatedSettings);
      console.log('[useUserSettings] Settings saved to localStorage:', partial);
      return;
    }

    try {
      // Save to S5 in background (async, doesn't block UI)
      await storageManager.updateUserSettings(partial);
      console.log('[useUserSettings] Settings updated successfully to S5:', partial);

      // Update localStorage cache on successful save
      setSettings(prev => {
        if (prev) {
          const updated = { ...prev, ...partial, lastUpdated: Date.now() };
          cacheSettings(updated);
          return updated;
        }
        return prev;
      });
    } catch (err: any) {
      console.error('[useUserSettings] Failed to update settings:', err);

      // Step 3: On error - DON'T revert optimistic update (eventual consistency)
      // The UI has already updated, user saw instant feedback

      // Check if it's a network error - queue for retry if so
      if (isNetworkError(err)) {
        console.log('[useUserSettings] Network error - queueing update for sync');
        setSyncQueue(prev => [...prev, partial]);
        setError('Offline - changes will sync when reconnected');
      } else {
        setError(err.message || 'Failed to update settings');
      }

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

  /**
   * Process sync queue - attempt to save all queued updates to S5
   */
  const processSyncQueue = useCallback(async () => {
    if (syncQueue.length === 0 || !storageManager) return;

    console.log(`[useUserSettings] Processing ${syncQueue.length} queued update(s)`);

    // Process all queued updates
    for (const partial of syncQueue) {
      try {
        await storageManager.updateUserSettings(partial);
        console.log('[useUserSettings] Queued update synced:', partial);
      } catch (err) {
        console.error('[useUserSettings] Failed to sync queued update:', err);
        // Keep in queue for next retry
        return;
      }
    }

    // Clear queue after successful sync
    console.log('[useUserSettings] All queued updates synced successfully');
    setSyncQueue([]);
  }, [syncQueue, storageManager]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Detect online/offline status and auto-sync when connection restored
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[useUserSettings] Connection restored');
      setIsOnline(true);
      // Attempt to sync queued updates
      processSyncQueue();
    };

    const handleOffline = () => {
      console.log('[useUserSettings] Connection lost');
      setIsOnline(false);
    };

    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processSyncQueue]);

  return {
    settings,
    loading,
    error,
    isOnline,
    updateSettings,
    resetSettings,
    refreshSettings
  };
}
