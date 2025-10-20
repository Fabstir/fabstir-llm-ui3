// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineBannerProps {
  pendingUpdates?: number;
  onRetry?: () => void;
}

export function OfflineBanner({ pendingUpdates = 0, onRetry }: OfflineBannerProps) {
  return (
    <Card className="border-amber-500/50 bg-amber-500/10">
      <CardContent className="flex items-center justify-between gap-4 p-3">
        <div className="flex items-start gap-3 flex-1">
          <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              You're offline
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {pendingUpdates > 0
                ? `${pendingUpdates} change${pendingUpdates !== 1 ? 's' : ''} will sync when reconnected`
                : 'Changes will sync when your connection is restored'}
            </p>
          </div>
        </div>

        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
