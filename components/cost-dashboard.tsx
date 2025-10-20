// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Zap, TrendingUp, Wallet, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { ParsedHost } from "@/types/host";
import { useState } from "react";

interface CostDashboardProps {
  usdcBalance: string;
  ethBalance?: string;
  totalCost: number;
  totalTokens: number;
  messages: Array<{
    timestamp: number;
    tokens?: number;
    role?: string;
  }>;
  selectedHost?: ParsedHost | null;
}

export function CostDashboard({
  usdcBalance,
  ethBalance,
  totalCost,
  totalTokens,
  messages,
  selectedHost,
}: CostDashboardProps) {
  // Prepare data for chart - only include messages with tokens
  const messagesWithTokens = messages.filter((m) => m.tokens && m.role !== "system");

  // Use actual pricing from selected host
  const pricePerToken = selectedHost?.minPricePerTokenStable
    ? Number(selectedHost.minPricePerTokenStable)
    : 316;  // Fallback to 0.000316 USDC/token

  const chartData = messagesWithTokens.map((m, idx) => ({
    index: idx + 1,
    tokens: m.tokens!,
    cost: (m.tokens! * pricePerToken) / 1000000,
    cumulative: messagesWithTokens
      .slice(0, idx + 1)
      .reduce((sum, msg) => sum + (msg.tokens || 0), 0),
  }));

  const avgCostPerMessage =
    messagesWithTokens.length > 0 ? totalCost / messagesWithTokens.length : 0;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="w-full space-y-4"
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Active Session Analytics
        </h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* Collapsible Content: Stats + Chart */}
      <CollapsibleContent>
        {/* Balance and Cost Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          {/* USDC Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USDC Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${usdcBalance}</div>
              <p className="text-xs text-muted-foreground">
                Available for sessions
              </p>
            </CardContent>
          </Card>

          {/* ETH Balance */}
          {ethBalance && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ethBalance} ETH</div>
                <p className="text-xs text-muted-foreground">
                  For gas fees
                </p>
              </CardContent>
            </Card>
          )}

          {/* Session Cost */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">
                ${avgCostPerMessage.toFixed(4)}/message avg
              </p>
            </CardContent>
          </Card>

          {/* Tokens Used */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTokens}</div>
              <Badge variant="secondary" className="mt-1">
                ~{Math.ceil(totalTokens / 100)} checkpoints
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Usage Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Token Usage Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tracking {chartData.length} messages with token data
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="index"
                    label={{
                      value: "Message #",
                      position: "insideBottom",
                      offset: -5,
                    }}
                    className="text-xs"
                  />
                  <YAxis
                    label={{
                      value: "Tokens",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    className="text-xs"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                            <p className="font-medium">
                              Message #{payload[0].payload.index}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tokens: {payload[0].payload.tokens}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Cost: ${payload[0].payload.cost.toFixed(4)}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              Cumulative: {payload[0].payload.cumulative} tokens
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#8884d8"
                    strokeWidth={2}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {chartData.length === 0 && messages.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Send messages with token data to see usage charts</p>
            </CardContent>
          </Card>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
