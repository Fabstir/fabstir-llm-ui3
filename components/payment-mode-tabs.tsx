"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Zap, Info } from "lucide-react";
import { ReactNode } from "react";

interface PaymentModeTabsProps {
  children: ReactNode;
  defaultMode?: "usdc" | "eth";
  compact?: boolean; // Hide explanation cards for compact view
}

export function PaymentModeTabs({ children, defaultMode = "usdc", compact = false }: PaymentModeTabsProps) {
  return (
    <Tabs defaultValue={defaultMode} className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
        <TabsTrigger value="usdc" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          USDC Payment
        </TabsTrigger>
        <TabsTrigger value="eth" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          ETH Payment
        </TabsTrigger>
      </TabsList>

      <TabsContent value="usdc" className="mt-6 space-y-4">
        {!compact && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    USDC Payment Mode
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Pay for AI sessions using USDC stablecoin
                  </CardDescription>
                </div>
                <Badge variant="secondary">Recommended</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">How it works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Deposit USDC to start a session (default: $2.00)</li>
                    <li>• Pay per token used (2000 tokens per USDC)</li>
                    <li>• Automatic settlement when session ends</li>
                    <li>• Requires one-time USDC approval</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {children}
      </TabsContent>

      <TabsContent value="eth" className="mt-6 space-y-4">
        {!compact && (
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-purple-500" />
                    ETH Payment Mode
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Pay for AI sessions using native ETH
                  </CardDescription>
                </div>
                <Badge variant="outline">Alternative</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">How it works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Deposit ETH to start a session (default: 0.0006 ETH ≈ $2.40)</li>
                    <li>• Pay per token used (5000 wei per token)</li>
                    <li>• Automatic settlement when session ends</li>
                    <li>• No token approval needed (simpler flow)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {children}
      </TabsContent>
    </Tabs>
  );
}
