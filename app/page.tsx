"use client";

import { WalletConnectButton } from "@/components/wallet-connect-button";
import { useFabstirSDK } from "@/hooks/use-fabstir-sdk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Home() {
  const {
    isInitializing,
    isAuthenticated,
    userAddress,
    isMockMode,
    sessionManager,
    paymentManager,
    hostManager,
  } = useFabstirSDK();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Fabstir LLM Chat
          </h1>
          <p className="text-xl text-muted-foreground">
            A P2P marketplace for AI conversations
          </p>
          {isMockMode && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Mock Mode - UI Development
            </Badge>
          )}
        </div>

        {/* Wallet Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to start chatting with AI models on the Fabstir network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>

            {/* SDK Status */}
            {isInitializing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initializing SDK...</span>
              </div>
            )}

            {!isInitializing && isAuthenticated && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Wallet Address:</span>
                  <span className="text-sm font-mono">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        sessionManager ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span>Session</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        paymentManager ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span>Payment</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hostManager ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span>Host</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Ready to Chat!</CardTitle>
              <CardDescription>
                Your wallet is connected and the SDK is initialized
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Phase 2 complete! Next phases will add:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Host discovery and selection (Phase 3)</li>
                <li>Chat interface with streaming responses (Phase 4)</li>
                <li>Session management with payments (Phase 5)</li>
                <li>Cost tracking and analytics (Phase 6)</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
