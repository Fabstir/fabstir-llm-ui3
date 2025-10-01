"use client";

import { motion } from "framer-motion";
import { CheckCircle2, DollarSign, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionStatusProps {
  sessionId: bigint | null;
  totalTokens: number;
  totalCost: number;
  hostAddress?: string;
  model?: string;
}

export function SessionStatus({
  sessionId,
  totalTokens,
  totalCost,
  hostAddress,
  model,
}: SessionStatusProps) {
  if (!sessionId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Active Session</span>
              <Badge variant="outline" className="font-mono text-xs">
                #{sessionId.toString().slice(-8)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm">
              {hostAddress && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Host:</span>
                  <code className="text-xs">
                    {hostAddress.slice(0, 6)}...{hostAddress.slice(-4)}
                  </code>
                </div>
              )}

              {model && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Model:</span>
                  <Badge variant="secondary" className="text-xs">
                    {model}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{totalTokens}</span>
                <span className="text-muted-foreground text-xs">tokens</span>
              </div>

              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{totalCost.toFixed(4)}</span>
                <span className="text-muted-foreground text-xs">USD</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
