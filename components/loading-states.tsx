'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  submessage?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  message,
  submessage,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="text-center space-y-4">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin mx-auto text-primary')} />
        {message && (
          <p className="text-lg font-medium text-foreground">{message}</p>
        )}
        {submessage && (
          <p className="text-sm text-muted-foreground">{submessage}</p>
        )}
      </div>
    </div>
  );
}

interface ChatMessageSkeletonProps {
  count?: number;
  className?: string;
}

export function ChatMessageSkeleton({ count = 3, className }: ChatMessageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4 animate-pulse">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[70%] space-y-2">
              <div className="h-4 bg-primary/20 rounded w-16 ml-auto" />
              <div className="bg-primary/10 rounded-2xl p-4 space-y-2">
                <div className="h-4 bg-primary/30 rounded w-full" />
                <div className="h-4 bg-primary/30 rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* AI response */}
          <div className="flex justify-start">
            <div className="max-w-[70%] space-y-2">
              <div className="h-4 bg-muted rounded w-12" />
              <div className="bg-muted rounded-2xl p-4 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-full" />
                <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
                <div className="h-4 bg-muted-foreground/20 rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ModelCardSkeletonProps {
  count?: number;
  className?: string;
}

export function ModelCardSkeleton({ count = 3, className }: ModelCardSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border-2 border-muted animate-pulse">
          <div className="space-y-3">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-24" />
              <div className="h-6 bg-muted rounded w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SettingsSkeletonProps {
  className?: string;
}

export function SettingsSkeleton({ className }: SettingsSkeletonProps) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      <div className="h-6 bg-muted rounded w-1/4" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-8 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
  submessage?: string;
  fullHeight?: boolean;
  className?: string;
}

export function PageLoading({
  message = 'Loading...',
  submessage = 'Please wait',
  fullHeight = true,
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullHeight && 'min-h-[calc(100vh-4rem)]',
        className
      )}
    >
      <LoadingSpinner size="lg" message={message} submessage={submessage} />
    </div>
  );
}
