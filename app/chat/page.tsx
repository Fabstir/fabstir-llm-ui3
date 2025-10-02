"use client";

import { useState } from "react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { HostSelector } from "@/components/host-selector";
import { ChatInterface } from "@/components/chat-interface";
import { SessionControls } from "@/components/session-controls";
import { SessionStatus } from "@/components/session-status";
import { CostDashboard } from "@/components/cost-dashboard";
import { PaymentModeTabs } from "@/components/payment-mode-tabs";
import { ErrorBoundary } from "@/components/error-boundary";
import { useFabstirSDK } from "@/hooks/use-fabstir-sdk";
import { useHosts } from "@/hooks/use-hosts";
import { useChatSession } from "@/hooks/use-chat-session";
import { useBalances } from "@/hooks/use-balances";
import { useBaseAccount } from "@/hooks/use-base-account";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles, Zap } from "lucide-react";

export default function ChatPage() {
  const {
    sdk,
    isInitializing,
    isAuthenticated,
    userAddress,
    isMockMode,
    sessionManager,
    paymentManager,
    hostManager,
  } = useFabstirSDK();

  const {
    connectWithBaseAccount,
    accountInfo,
    isConnecting: isConnectingBase,
    getSdk,
  } = useBaseAccount();

  // Get managers from Base Account SDK if connected that way
  const baseAccountSdk = getSdk();
  const effectiveHostManager = baseAccountSdk?.getHostManager() || hostManager;
  const effectiveSessionManager = baseAccountSdk?.getSessionManager() || sessionManager;
  const effectivePaymentManager = baseAccountSdk?.getPaymentManager() || paymentManager;

  const [usdcAddress, setUsdcAddress] = useState<string>("");

  const {
    availableHosts,
    selectedHost,
    setSelectedHost,
    isDiscoveringHosts,
    discoverHosts,
  } = useHosts(effectiveHostManager);

  const {
    messages,
    sessionId,
    totalTokens,
    totalCost,
    isSessionActive,
    startSession,
    isStartingSession,
    sendMessage,
    isSendingMessage,
    endSession,
    isEndingSession,
  } = useChatSession(
    effectiveSessionManager,
    selectedHost,
    effectivePaymentManager,
    accountInfo?.subAccount || userAddress
  );

  const { usdcBalance, ethBalance, isLoading: isLoadingBalances } = useBalances(
    effectivePaymentManager,
    accountInfo?.subAccount || userAddress
  );

  // Handler for Base Account connection
  const handleBaseAccountConnect = async () => {
    try {
      // Import SDK and initialize if needed
      const { FabstirSDKCore, ChainRegistry, ChainId } = await import("@fabstir/sdk-core");
      const chain = ChainRegistry.getChain(ChainId.BASE_SEPOLIA);

      // Create SDK if not exists
      let sdkInstance = sdk;
      if (!sdkInstance) {
        const sdkConfig = {
          mode: "production" as const,
          chainId: ChainId.BASE_SEPOLIA,
          rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA!,
          contractAddresses: {
            jobMarketplace: chain.contracts.jobMarketplace,
            nodeRegistry: chain.contracts.nodeRegistry,
            proofSystem: chain.contracts.proofSystem,
            hostEarnings: chain.contracts.hostEarnings,
            fabToken: chain.contracts.fabToken,
            usdcToken: chain.contracts.usdcToken,
            modelRegistry: chain.contracts.modelRegistry,
          },
          s5Config: {
            portalUrl: process.env.NEXT_PUBLIC_S5_PORTAL_URL,
          },
        };
        sdkInstance = new FabstirSDKCore(sdkConfig);
      }

      // Connect with Base Account
      await connectWithBaseAccount(sdkInstance, chain.contracts.usdcToken, ChainId.BASE_SEPOLIA);
    } catch (error) {
      console.error("Base Account connection failed:", error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Initializing Fabstir SDK...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">AI Chat</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect your wallet, select a host, and start chatting with AI models on the decentralized Fabstir network
          </p>
        </div>

        {/* Wallet Connection Card */}
        {!isAuthenticated && !isMockMode && !accountInfo && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to start chatting with AI models on the Fabstir network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <WalletConnectButton />
                <Button
                  onClick={handleBaseAccountConnect}
                  disabled={isConnectingBase}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  {isConnectingBase ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Connect with Base Account (Popup-Free)
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Base Account: First transaction requires ONE popup for permission. Subsequent transactions are popup-free! ✨
              </p>
            </CardContent>
          </Card>
        )}

        {/* SDK Status (when wallet connected) */}
        {(isAuthenticated || accountInfo) && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Connected
                  </Badge>
                  {accountInfo?.isUsingBaseAccount && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1">
                      <Zap className="h-3 w-3" />
                      Base Account
                    </Badge>
                  )}
                  <span className="text-sm font-mono">
                    {(accountInfo?.subAccount || userAddress).slice(0, 6)}...{(accountInfo?.subAccount || userAddress).slice(-4)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                    <div className={`h-2 w-2 rounded-full ${effectiveSessionManager ? "bg-green-500" : "bg-gray-400"}`} />
                    <span>Session</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                    <div className={`h-2 w-2 rounded-full ${effectivePaymentManager ? "bg-green-500" : "bg-gray-400"}`} />
                    <span>Payment</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                    <div className={`h-2 w-2 rounded-full ${effectiveHostManager ? "bg-green-500" : "bg-gray-400"}`} />
                    <span>Host</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Host Discovery */}
        {(isAuthenticated || accountInfo) && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Select AI Host</CardTitle>
                  <CardDescription>
                    Discover available hosts on the Fabstir network
                  </CardDescription>
                </div>
                <Button
                  onClick={discoverHosts}
                  disabled={isDiscoveringHosts}
                  size="sm"
                >
                  {isDiscoveringHosts ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Discover Hosts
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <HostSelector
                hosts={availableHosts}
                selectedHost={selectedHost}
                onSelect={setSelectedHost}
                isLoading={isDiscoveringHosts}
              />
            </CardContent>
          </Card>
        )}

        {/* Payment Mode Tabs & Chat (only when host selected) */}
        {(isAuthenticated || accountInfo) && selectedHost && (
          <div className="max-w-6xl mx-auto">
            <PaymentModeTabs defaultMode="usdc">
              <div className="space-y-4">
                {/* Session Status */}
                {sessionId && (
                  <SessionStatus
                    sessionId={sessionId}
                    totalTokens={totalTokens}
                    totalCost={totalCost}
                    hostAddress={selectedHost.address}
                    model={selectedHost.models[0]}
                  />
                )}

                {/* Session Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session</CardTitle>
                    <CardDescription>
                      {isSessionActive
                        ? "Session active - you can chat with the AI"
                        : "Start a session to begin chatting"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SessionControls
                      isSessionActive={isSessionActive}
                      onStartSession={startSession}
                      onEndSession={endSession}
                      isStarting={isStartingSession}
                      isEnding={isEndingSession}
                      disabled={!selectedHost}
                    />
                  </CardContent>
                </Card>

                {/* Cost Dashboard (only when session active) */}
                {isSessionActive && (
                  <CostDashboard
                    usdcBalance={usdcBalance}
                    ethBalance={ethBalance}
                    totalCost={totalCost}
                    totalTokens={totalTokens}
                    messages={messages}
                  />
                )}

                {/* Chat Interface */}
                <ChatInterface
                  messages={messages}
                  onSendMessage={sendMessage}
                  isSending={isSendingMessage}
                  isSessionActive={isSessionActive}
                />
              </div>
            </PaymentModeTabs>
          </div>
        )}
      </main>
    </ErrorBoundary>
  );
}
