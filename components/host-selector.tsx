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
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    <code className="text-sm font-mono">
                      {host.address.slice(0, 10)}...{host.address.slice(-8)}
                    </code>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                    {host.endpoint}
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
