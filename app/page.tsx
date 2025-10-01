"use client";

import { WalletConnectButton } from "@/components/wallet-connect-button";
import { HostSelector } from "@/components/host-selector";
import { ChatInterface } from "@/components/chat-interface";
import { SessionControls } from "@/components/session-controls";
import { SessionStatus } from "@/components/session-status";
import { useFabstirSDK } from "@/hooks/use-fabstir-sdk";
import { useHosts } from "@/hooks/use-hosts";
import { useChatSession } from "@/hooks/use-chat-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

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

  const {
    availableHosts,
    selectedHost,
    setSelectedHost,
    isDiscoveringHosts,
    discoverHosts,
  } = useHosts(hostManager);

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
  } = useChatSession(sessionManager, selectedHost);

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

        {/* Host Discovery */}
        {isAuthenticated && (
          <Card>
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

        {/* Session Management & Chat */}
        {isAuthenticated && selectedHost && (
          <div className="space-y-4">
            {/* Session Status */}
            <SessionStatus
              sessionId={sessionId}
              totalTokens={totalTokens}
              totalCost={totalCost}
              hostAddress={selectedHost.address}
              model={selectedHost.models[0]}
            />

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

            {/* Chat Interface */}
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isSending={isSendingMessage}
              isSessionActive={isSessionActive}
            />
          </div>
        )}
      </div>
    </main>
  );
}
