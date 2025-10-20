// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

'use client';

import { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff, Database, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'offline' | 'settings';
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  variant = 'error',
  className,
}: ErrorStateProps) {
  const config = {
    error: {
      icon: <AlertCircle className="w-12 h-12 text-destructive" />,
      title: 'Something went wrong',
      description: 'An error occurred. Please try again.',
      gradient: 'from-destructive/10 to-destructive/5',
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-warning" />,
      title: 'Unable to complete action',
      description: 'There was a problem processing your request.',
      gradient: 'from-warning/10 to-warning/5',
    },
    offline: {
      icon: <WifiOff className="w-12 h-12 text-muted-foreground" />,
      title: 'No internet connection',
      description: 'Please check your connection and try again.',
      gradient: 'from-muted/10 to-muted/5',
    },
    settings: {
      icon: <Database className="w-12 h-12 text-primary/60" />,
      title: 'Unable to load settings',
      description: 'Using default settings. Your preferences will be saved once connected.',
      gradient: 'from-primary/10 to-primary/5',
    },
  };

  const currentConfig = config[variant];
  const displayTitle = title || currentConfig.title;
  const displayDescription = description || currentConfig.description;

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-6 max-w-md">
        {/* Icon with gradient background */}
        <div className="relative inline-flex">
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br blur-2xl opacity-20 rounded-full',
              currentConfig.gradient
            )}
          />
          <div className="relative bg-card border border-border/50 rounded-full p-5">
            {currentConfig.icon}
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {displayTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {displayDescription}
          </p>
        </div>

        {/* Retry button */}
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="gap-2 mt-4"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

interface NoModelsStateProps {
  onRefresh?: () => void;
  className?: string;
}

export function NoModelsState({ onRefresh, className }: NoModelsStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl opacity-20 rounded-full" />
          <div className="relative bg-card border border-border/50 rounded-full p-5">
            <Database className="w-12 h-12 text-primary/60" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            No models available
          </h3>
          <p className="text-sm text-muted-foreground">
            No AI models found. Try refreshing the model list or check back later.
          </p>
        </div>

        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            className="gap-2 mt-4"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Models
          </Button>
        )}
      </div>
    </div>
  );
}

interface SettingsErrorStateProps {
  error?: string;
  onRetry?: () => void;
  onUseDefaults?: () => void;
  className?: string;
}

export function SettingsErrorState({
  error,
  onRetry,
  onUseDefaults,
  className,
}: SettingsErrorStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-destructive/10 blur-2xl opacity-20 rounded-full" />
          <div className="relative bg-card border border-border/50 rounded-full p-5">
            <AlertCircle className="w-12 h-12 text-warning" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Settings Error
          </h3>
          <p className="text-sm text-muted-foreground">
            {error || 'Unable to load your preferences. You can retry or continue with default settings.'}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          )}
          {onUseDefaults && (
            <Button
              onClick={onUseDefaults}
              variant="default"
            >
              Use Defaults
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
