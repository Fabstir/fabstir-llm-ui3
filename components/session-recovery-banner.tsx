// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, X } from "lucide-react";
import { RecoverableSession } from "@/hooks/use-session-recovery";

interface SessionRecoveryBannerProps {
  session: RecoverableSession;
  onRecover: () => void;
  onDismiss: () => void;
}

export function SessionRecoveryBanner({
  session,
  onRecover,
  onDismiss,
}: SessionRecoveryBannerProps) {
  const timeAgo = Math.floor((Date.now() - session.timestamp) / 1000 / 60);
  const timeAgoText =
    timeAgo < 60
      ? `${timeAgo} minute${timeAgo !== 1 ? "s" : ""} ago`
      : `${Math.floor(timeAgo / 60)} hour${Math.floor(timeAgo / 60) !== 1 ? "s" : ""} ago`;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Previous session found</p>
            <p className="text-xs text-muted-foreground">
              You have an active session from {timeAgoText} with{" "}
              {session.messages.length} message{session.messages.length !== 1 ? "s" : ""} and{" "}
              {session.totalTokens} tokens used (${session.totalCost.toFixed(4)}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onRecover} size="sm" variant="default">
            Recover Session
          </Button>
          <Button
            onClick={onDismiss}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
