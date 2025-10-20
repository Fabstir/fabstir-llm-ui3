// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { motion } from "framer-motion";
import { Play, Square, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SessionControlsProps {
  isSessionActive: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  isStarting: boolean;
  isEnding: boolean;
  disabled?: boolean;
  insufficientBalance?: {
    hasEnough: boolean;
    balance: string;
    address: string | null;
    isUsingBaseAccount: boolean;
  };
}

export function SessionControls({
  isSessionActive,
  onStartSession,
  onEndSession,
  isStarting,
  isEnding,
  disabled = false,
  insufficientBalance,
}: SessionControlsProps) {
  const showInsufficientBalanceWarning = insufficientBalance && !insufficientBalance.hasEnough && !isSessionActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {showInsufficientBalanceWarning && (
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Insufficient Balance</strong>
            <p className="mt-1">
              {insufficientBalance.isUsingBaseAccount ? (
                <>
                  Your balance: {insufficientBalance.balance} USDC (need $2.00 USDC)
                  <br />
                  <span className="text-xs">
                    💡 Deposit USDC to your account to start chatting
                  </span>
                </>
              ) : (
                <>
                  Your wallet has {insufficientBalance.balance} USDC. Need at least $2 USDC to start a session.
                  <br />
                  <span className="text-xs">💡 Add USDC to your wallet to continue</span>
                </>
              )}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-center">
        {!isSessionActive ? (
          <ShimmerButton
            onClick={onStartSession}
            disabled={isStarting || disabled || (insufficientBalance && !insufficientBalance.hasEnough)}
            className="shadow-lg"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Session ($2 USDC)
              </>
            )}
          </ShimmerButton>
        ) : (
          <Button
            onClick={onEndSession}
            disabled={isEnding}
            variant="destructive"
            size="lg"
          >
            {isEnding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <Square className="mr-2 h-4 w-4" />
                End Session
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
