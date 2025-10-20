// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

'use client';

import { useState } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface SettingsPanelProps {
  selectedModel?: string;
  preferredPaymentToken?: 'USDC' | 'ETH';
  theme?: 'light' | 'dark' | 'auto';
  lastUpdated?: number;
  onResetPreferences?: () => void;
}

export function SettingsPanel({
  selectedModel,
  preferredPaymentToken,
  theme,
  lastUpdated,
  onResetPreferences,
}: SettingsPanelProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetConfirm = () => {
    setShowResetDialog(false);
    if (onResetPreferences) {
      onResetPreferences();
    }
  };

  const formatLastUpdated = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const getThemeDisplay = (theme?: 'light' | 'dark' | 'auto') => {
    if (!theme) return 'Auto';
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Current Settings</CardTitle>
              <CardDescription>
                Your saved preferences and last update time
              </CardDescription>
            </div>
            <Info className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">AI Model</div>
              <div className="font-mono text-sm">
                {selectedModel || (
                  <span className="text-muted-foreground">Not selected</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Payment Token</div>
              <Badge variant={preferredPaymentToken === 'USDC' ? 'default' : 'secondary'}>
                {preferredPaymentToken || 'USDC'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Theme</div>
              <Badge variant="outline">
                {getThemeDisplay(theme)}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-sm font-medium">
                {formatLastUpdated(lastUpdated)}
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {onResetPreferences && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Reset All Preferences</div>
                  <div className="text-xs text-muted-foreground">
                    Clear all saved preferences and start fresh
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Preferences?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your saved settings including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Selected AI model</li>
                <li>Payment token preference</li>
                <li>Theme preference</li>
                <li>Recently used models</li>
                <li>Host preferences</li>
              </ul>
              <p className="mt-3 font-semibold">
                This action cannot be undone. The page will reload and you'll see the setup wizard again.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset All Preferences
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
