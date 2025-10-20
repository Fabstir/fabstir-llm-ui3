// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { motion } from "framer-motion";
import { Server, ExternalLink, Check } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParsedHost } from "@/types/host";
import { cn } from "@/lib/utils";

interface HostSelectorProps {
  hosts: ParsedHost[];
  selectedHost: ParsedHost | null;
  onSelect: (host: ParsedHost) => void;
  isLoading: boolean;
}

export function HostSelector({
  hosts,
  selectedHost,
  onSelect,
  isLoading,
}: HostSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (hosts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No Hosts Available</p>
          <p className="text-sm text-muted-foreground">
            Click "Discover Hosts" to search the network
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Available Hosts ({hosts.length})
        </h3>
        <Badge variant="outline">{hosts.length} online</Badge>
      </div>

      {hosts.map((host, idx) => (
        <motion.div
          key={host.address}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedHost?.address === host.address &&
                "ring-2 ring-primary shadow-lg"
            )}
            onClick={() => onSelect(host)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-5 h-5" />
                    <span className="text-xs font-semibold text-muted-foreground">Host Address:</span>
                  </div>
                  <code className="text-sm font-mono block mb-3">
                    {host.address}
                  </code>
                  <div className="flex items-start gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">Endpoint:</span>
                      <code className="text-xs font-mono text-foreground break-all">{host.endpoint}</code>
                    </div>
                  </div>
                </div>
                {selectedHost?.address === host.address && (
                  <Badge className="bg-primary">
                    <Check className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">Supported Models:</p>
                  <div className="flex flex-wrap gap-1">
                    {host.models.map((model) => (
                      <Badge key={model} variant="secondary">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Pricing:</p>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>USDC:</span>
                      <span className="font-mono">{(Number(host.minPricePerTokenStable) / 1_000_000).toFixed(6)} USDC/token</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ETH:</span>
                      <span className="font-mono">{(Number(host.minPricePerTokenNative) / 1e18).toFixed(8)} ETH/token</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    Stake: {(Number(host.stake) / 1e18).toFixed(2)} FAB
                  </span>
                  {selectedHost?.address !== host.address && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(host);
                      }}
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
