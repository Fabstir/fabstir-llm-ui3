"use client";

import { motion } from "framer-motion";
import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface SessionControlsProps {
  isSessionActive: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  isStarting: boolean;
  isEnding: boolean;
  disabled?: boolean;
}

export function SessionControls({
  isSessionActive,
  onStartSession,
  onEndSession,
  isStarting,
  isEnding,
  disabled = false,
}: SessionControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-center"
    >
      {!isSessionActive ? (
        <ShimmerButton
          onClick={onStartSession}
          disabled={isStarting || disabled}
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
    </motion.div>
  );
}
