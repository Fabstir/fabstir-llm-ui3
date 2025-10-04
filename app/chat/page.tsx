"use client";

import { useState, useEffect } from "react";
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
import { useBalances, useHasSufficientBalance } from "@/hooks/use-balances";
import { useBaseAccount } from "@/hooks/use-base-account";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useSessionRecovery, useAutoSaveSession } from "@/hooks/use-session-recovery";
import { SessionRecoveryBanner } from "@/components/session-recovery-banner";
import { SuccessAnimation } from "@/components/brand";
import { USDCDeposit } from "@/components/usdc-deposit";
import { useUserSettings } from "@/hooks/use-user-settings";
import { SetupWizard } from "@/components/setup-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles, Zap, Wallet } from "lucide-react";

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
    storageManager,
  } = useFabstirSDK();

  const {
    connectWithBaseAccount,
    accountInfo,
    isConnecting: isConnectingBase,
    getSdk,
  } = useBaseAccount();

  // Log account addresses for debugging (only once when accountInfo changes)
  useEffect(() => {
    if (accountInfo) {
      console.log('💰 Account Info:', {
        primaryAccount: accountInfo.primaryAccount,
        subAccount: accountInfo.subAccount,
        isUsingBaseAccount: accountInfo.isUsingBaseAccount,
      });
    }
  }, [accountInfo?.primaryAccount, accountInfo?.subAccount]);

  // Get managers from Base Account SDK if connected that way
  const baseAccountSdk = getSdk();
  const effectiveHostManager = baseAccountSdk?.getHostManager() || hostManager;
  const effectiveSessionManager = baseAccountSdk?.getSessionManager() || sessionManager;
  const effectivePaymentManager = baseAccountSdk?.getPaymentManager() || paymentManager;
  const effectiveStorageManager = baseAccountSdk?.getStorageManager() || storageManager;

  // User Settings (S5 storage integration)
  const {
    settings,
    loading: loadingSettings,
    error: settingsError,
    updateSettings,
  } = useUserSettings(effectiveStorageManager);

  // First-time user detection
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Check if user is first-time (settings === null) after settings load
  useEffect(() => {
    if (!loadingSettings) {
      if (settings === null) {
        console.log('[First-Time User] No settings found - showing setup wizard');
        setShowSetupWizard(true);
      } else {
        console.log('[Returning User] Settings loaded:', settings);
        setShowSetupWizard(false);

        // Apply restored settings
        if (settings.selectedModel) {
          console.log('[Settings] Restoring model preference:', settings.selectedModel);
          // TODO: Auto-select model when model selector is implemented
        }
        if (settings.theme) {
          console.log('[Settings] Restoring theme:', settings.theme);
          // TODO: Apply theme when theme system is implemented
        }
      }
    }
  }, [settings, loadingSettings]);

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
    showSuccessAnimation,
  } = useChatSession(
    effectiveSessionManager,
    selectedHost,
    effectivePaymentManager,
    accountInfo?.subAccount || userAddress,
    effectiveStorageManager
  );

  const { usdcBalance, ethBalance, isLoading: isLoadingBalances } = useBalances(
    effectivePaymentManager,
    accountInfo?.subAccount || userAddress
  );

  // Check if user has sufficient balance to start a session
  const { hasEnough, balance, checkingAddress, isLoading: isCheckingBalance } = useHasSufficientBalance(
    accountInfo,
    userAddress,
    2.0 // $2 USDC minimum for session
  );

  // Keyboard shortcuts
  useGlobalKeyboardShortcuts(
    () => {
      if (isSessionActive) {
        endSession();
      }
    },
    () => {
      // Show keyboard shortcuts help
      console.log("Keyboard shortcuts: Ctrl+N (New chat), Ctrl+/ (Help), Escape (Close)");
    }
  );

  // Session recovery
  const {
    recoveredSession,
    saveSession,
    clearSession,
    dismissRecovery,
    hasRecoverableSession,
  } = useSessionRecovery();

  // Auto-save session state
  useAutoSaveSession(sessionId, messages, selectedHost, totalTokens, totalCost);

  // Handler for recovering session
  const handleRecoverSession = () => {
    if (!recoveredSession) return;

    // Note: In production, you would need to re-authenticate with the SDK
    // and restore the session state. For now, we just dismiss the banner.
    console.log("Recovering session:", recoveredSession);
    dismissRecovery();
  };

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

  // Show loading state for SDK initialization or settings loading
  if (isInitializing || loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">
            {isInitializing ? "Initializing Fabstir SDK..." : "Loading your preferences..."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Setup Wizard for First-Time Users */}
        {showSetupWizard && (
          <SetupWizard
            onComplete={async (wizardSettings) => {
              try {
                console.log('[SetupWizard] Saving settings:', wizardSettings);

                // Save settings to S5 using updateSettings (which handles initial save)
                await updateSettings({
                  selectedModel: wizardSettings.selectedModel,
                  theme: wizardSettings.theme,
                  preferredPaymentToken: wizardSettings.preferredPaymentToken,
                });

                console.log('[SetupWizard] Settings saved successfully');

                // Close wizard and show chat
                setShowSetupWizard(false);
              } catch (error: any) {
                console.error('[SetupWizard] Failed to save settings:', error);
                // Still close wizard even on error (graceful degradation)
                setShowSetupWizard(false);
              }
            }}
            onSkip={() => {
              console.log('[SetupWizard] User skipped setup');
              setShowSetupWizard(false);
            }}
          />
        )}

        {/* Main Chat UI (hidden when setup wizard is shown) */}
        {!showSetupWizard && (
          <>
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

        {/* Session Recovery Banner */}
        {hasRecoverableSession && recoveredSession && (
          <div className="max-w-4xl mx-auto">
            <SessionRecoveryBanner
              session={recoveredSession}
              onRecover={handleRecoverSession}
              onDismiss={dismissRecovery}
            />
          </div>
        )}

        {/* Wallet Connection Card */}
        {!isMockMode && (!isAuthenticated || !accountInfo) && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Connect Your Wallets</CardTitle>
              <CardDescription>
                {!accountInfo && !isAuthenticated && "Connect Base Account for popup-free transactions, then connect regular wallet to fund it"}
                {accountInfo && !isAuthenticated && "Connect regular wallet (MetaMask/Rainbow) to deposit USDC"}
                {!accountInfo && isAuthenticated && "Connect Base Account for popup-free transactions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Base Account Connection */}
                <div className={`p-4 rounded-lg border-2 ${accountInfo ? 'border-green-500 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {accountInfo ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-semibold text-sm">Base Account Connected</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">Base Account</span>
                        </>
                      )}
                    </div>
                    {accountInfo ? (
                      <div className="text-xs text-muted-foreground">
                        ✅ Popup-free transactions enabled
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Popup-free AI sessions
                        </p>
                        <Button
                          onClick={handleBaseAccountConnect}
                          disabled={isConnectingBase}
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                        >
                          {isConnectingBase ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              Connect
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* EOA Wallet Connection */}
                <div className={`p-4 rounded-lg border-2 ${isAuthenticated ? 'border-green-500 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isAuthenticated ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-semibold text-sm">Wallet Connected</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">Regular Wallet</span>
                        </>
                      )}
                    </div>
                    {isAuthenticated ? (
                      <div className="text-xs text-muted-foreground">
                        ✅ Ready to deposit USDC
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Fund Base Account
                        </p>
                        <div className="w-full">
                          <WalletConnectButton />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                💡 <strong>Both wallets needed:</strong> Base Account for popup-free transactions, regular wallet to initially fund it
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
                    {(accountInfo?.primaryAccount || userAddress).slice(0, 6)}...{(accountInfo?.primaryAccount || userAddress).slice(-4)}
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

        {/* USDC Deposit (Base Account only) */}
        {accountInfo?.isUsingBaseAccount && accountInfo.primaryAccount && (
          <div className="max-w-4xl mx-auto">
            <USDCDeposit
              primaryAccount={accountInfo.primaryAccount}
              subAccount={accountInfo.subAccount}
              usdcAddress={process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN!}
              onDepositComplete={async () => {
                // Refresh balances after deposit
                console.log("Deposit complete, refreshing balances...");
              }}
            />
          </div>
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
                      insufficientBalance={{
                        hasEnough,
                        balance,
                        address: checkingAddress,
                        isUsingBaseAccount: accountInfo?.isUsingBaseAccount ?? false,
                      }}
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
          </>
        )}
      </main>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <SuccessAnimation
          message="Session ended successfully! 🎉"
          duration={2000}
        />
      )}
    </ErrorBoundary>
  );
}
