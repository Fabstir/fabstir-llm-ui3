"use client";

import { useState, useEffect, useCallback } from "react";
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
import { CompactHeader } from "@/components/compact-header";
import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ModelSelector } from "@/components/model-selector";
import { OfflineBanner } from "@/components/offline-banner";
import { PageLoading } from "@/components/loading-states";
import { SettingsErrorState } from "@/components/empty-states";
import { useAnalytics } from "@/lib/analytics";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles, Zap, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const { toast } = useToast();
  const analytics = useAnalytics();

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

  // Debug: Log which managers are being used
  useEffect(() => {
    console.log('[Manager Debug] effectiveHostManager source:', {
      fromBaseAccount: !!baseAccountSdk?.getHostManager(),
      fromFabstirSDK: !!hostManager,
      isAvailable: !!effectiveHostManager
    });
  }, [baseAccountSdk, hostManager, effectiveHostManager]);

  // User Settings (S5 storage integration)
  const {
    settings,
    loading: loadingSettings,
    error: settingsError,
    isOnline,
    updateSettings,
    resetSettings,
  } = useUserSettings(effectiveStorageManager);

  // First-time user detection
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [hasLoadedSettingsOnce, setHasLoadedSettingsOnce] = useState(false);

  // Preserve savedHostAddress across StorageManager transitions
  const [preservedHostAddress, setPreservedHostAddress] = useState<string | undefined>(undefined);

  // Update preserved host address when settings change
  useEffect(() => {
    if (settings?.lastHostAddress && settings.lastHostAddress !== preservedHostAddress) {
      console.log('[Host Preservation] Saving host address:', settings.lastHostAddress);
      setPreservedHostAddress(settings.lastHostAddress);
    }
  }, [settings?.lastHostAddress]);

  // Header modal states
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showHostSelector, setShowHostSelector] = useState(false);
  const [isSelectingHost, setIsSelectingHost] = useState(false);

  /**
   * Apply theme to the document
   * Handles 'auto' mode by detecting system preference
   */
  const applyTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined') return;

    document.documentElement.classList.remove('light', 'dark');

    if (theme === 'auto') {
      // Auto mode: Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
      // If not dark, default is light (no class needed)
    } else {
      // Explicit light or dark mode
      document.documentElement.classList.add(theme);
    }
  }, []);

  // Host management - must come BEFORE any useEffect that references selectedHost
  const {
    availableHosts,
    selectedHost,
    setSelectedHost,
    isDiscoveringHosts,
    discoverHosts,
    selectHostForModel,
    restoreHostByAddress,
  } = useHosts(effectiveHostManager);

  // Check if user is first-time (settings === null) after settings load
  useEffect(() => {
    // Wait for settings to finish loading before making any decisions
    if (loadingSettings) {
      console.log('[Settings] Loading settings from S5...');
      return; // Still loading, don't make any decisions yet
    }

    // Settings finished loading - now decide what to do
    if (settings === null) {
      // No settings found
      if (hasLoadedSettingsOnce) {
        // Already loaded settings successfully before - this is a re-load issue
        console.log('[Settings] Settings became null on reload (ignoring - already loaded once)');
        setShowSetupWizard(false);
      } else if (effectiveStorageManager) {
        // StorageManager available AND no settings found in S5 = truly first-time user
        console.log('[First-Time User] No settings found in S5 - showing setup wizard');
        setShowSetupWizard(true);
      } else {
        // No StorageManager yet - don't show wizard yet (settings might exist in S5)
        console.log('[Waiting] StorageManager not available - waiting for wallet connection to check S5');
        setShowSetupWizard(false);
      }
    } else {
      // Settings found - returning user!
      console.log('[Returning User] Settings loaded from S5:', settings);
      setShowSetupWizard(false);
      setHasLoadedSettingsOnce(true); // Mark that we've successfully loaded settings

      // Apply restored settings
      if (settings.selectedModel) {
        console.log('[Settings] Restoring model preference:', settings.selectedModel);
      }

      // Note: We do NOT automatically restore saved hosts from S5
      // This ensures random selection for decentralization on each session
      // Users can manually select and save hosts via "Change Host" button

      if (settings.theme) {
        console.log('[Settings] Restoring theme:', settings.theme);
        applyTheme(settings.theme);
      } else {
        // No theme saved, apply default (auto)
        applyTheme('auto');
      }
    }
  }, [settings, loadingSettings, applyTheme, selectedHost, restoreHostByAddress, effectiveHostManager, effectiveStorageManager, hasLoadedSettingsOnce, availableHosts, isDiscoveringHosts, discoverHosts]);

  // Listen for system preference changes (for Auto mode)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only re-apply if current theme is 'auto'
      if (settings?.theme === 'auto') {
        console.log('[Theme] System preference changed to:', e.matches ? 'dark' : 'light');
        applyTheme('auto');
      }
    };

    // Add listener
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [settings?.theme, applyTheme]);

  // Auto-connect Base Account if user preference is set
  useEffect(() => {
    if (
      !loadingSettings &&
      settings?.preferredWalletType === 'base-account' &&
      !accountInfo && // Not already connected
      !isConnectingBase && // Not currently connecting
      effectiveHostManager // HostManager ready (ensures SDK is initialized)
    ) {
      console.log('[Auto-Connect] Connecting Base Account based on user preference');
      handleBaseAccountConnect().catch(err => {
        console.error('[Auto-Connect] Failed:', err);
        // Don't retry to avoid infinite loops
      });
    }
  }, [settings, loadingSettings, accountInfo, isConnectingBase, effectiveHostManager]);

  // Automatic host discovery when wallet connects
  useEffect(() => {
    if (
      (accountInfo || isAuthenticated) &&  // Wallet connected
      !selectedHost &&                     // No host selected yet
      !isDiscoveringHosts &&              // Not already discovering
      effectiveHostManager                 // HostManager ready
    ) {
      if (availableHosts.length === 0) {
        // No hosts discovered yet - trigger discovery
        console.log('[Auto-Discovery] Triggering host discovery after wallet connection');
        discoverHosts();
      } else {
        // Hosts already exist but none selected - randomly select for decentralization
        const randomIndex = Math.floor(Math.random() * availableHosts.length);
        console.log(`[Auto-Recovery] Randomly selecting host ${randomIndex + 1} of ${availableHosts.length} for decentralization`);
        setSelectedHost(availableHosts[randomIndex]);
      }
    }
  }, [accountInfo, isAuthenticated, selectedHost, isDiscoveringHosts, effectiveHostManager, availableHosts, discoverHosts, setSelectedHost]);

  const [usdcAddress, setUsdcAddress] = useState<string>("");

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
    effectiveStorageManager,
    settings  // Pass settings for payment token preference
  );

  const { usdcBalance, ethBalance, isLoading: isLoadingBalances } = useBalances(
    effectivePaymentManager,
    accountInfo?.subAccount || userAddress
  );

  // Check if user has sufficient balance to start a session
  const { hasEnough, balance, primaryBalance, checkingAddress, isLoading: isCheckingBalance } = useHasSufficientBalance(
    accountInfo,
    userAddress,
    2.0 // $2 USDC minimum for session
  );

  // Derive model name for header
  const currentModelName = settings?.selectedModel || selectedHost?.models[0] || 'No model selected';

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
      const { FabstirSDKCore, ChainId } = await import("@fabstir/sdk-core");

      console.log('[Base Account] Using contract addresses from .env.local');

      // Create SDK if not exists
      let sdkInstance = sdk;
      if (!sdkInstance) {
        console.log('[Base Account] Creating new SDK instance...');
        const sdkConfig = {
          mode: "production" as const,
          chainId: ChainId.BASE_SEPOLIA,
          rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA!,
          contractAddresses: {
            jobMarketplace: process.env.NEXT_PUBLIC_CONTRACT_JOB_MARKETPLACE!,
            nodeRegistry: process.env.NEXT_PUBLIC_CONTRACT_NODE_REGISTRY!,
            proofSystem: process.env.NEXT_PUBLIC_CONTRACT_PROOF_SYSTEM!,
            hostEarnings: process.env.NEXT_PUBLIC_CONTRACT_HOST_EARNINGS!,
            fabToken: process.env.NEXT_PUBLIC_CONTRACT_FAB_TOKEN!,
            usdcToken: process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN!,
            modelRegistry: process.env.NEXT_PUBLIC_CONTRACT_MODEL_REGISTRY!,
          },
          s5Config: {
            portalUrl: process.env.NEXT_PUBLIC_S5_PORTAL_URL,
          },
        };
        console.log('[Base Account] SDK config:', {
          nodeRegistry: sdkConfig.contractAddresses.nodeRegistry,
          jobMarketplace: sdkConfig.contractAddresses.jobMarketplace,
          usdcToken: sdkConfig.contractAddresses.usdcToken
        });
        sdkInstance = new FabstirSDKCore(sdkConfig);
      } else {
        console.log('[Base Account] Using existing SDK instance');
      }

      // Connect with Base Account
      await connectWithBaseAccount(
        sdkInstance,
        process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN!,
        ChainId.BASE_SEPOLIA
      );
    } catch (error) {
      console.error("Base Account connection failed:", error);
    }
  };

  // Handler for theme changes
  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    // Apply theme immediately (optimistic UI)
    applyTheme(theme);

    // Show immediate feedback (optimistic)
    toast({
      title: "Theme updated",
      description: `Switched to ${theme} mode`,
    });

    try {
      // Save to S5 in background (optimistic - UI already updated)
      await updateSettings({ theme });

      // Track analytics after successful save
      analytics.themeChanged(theme);
    } catch (error: any) {
      console.error('[Theme] Save failed:', error);
      // Show error toast if save fails
      toast({
        title: "Failed to save theme",
        description: "Theme applied but preference not saved",
        variant: "destructive",
      });
    }
  };

  // Handler for payment token changes
  const handlePaymentTokenChange = async (token: 'USDC' | 'ETH') => {
    // Show immediate feedback (optimistic)
    toast({
      title: "Payment token updated",
      description: `Switched to ${token} for sessions`,
    });

    try {
      // Update settings (optimistic - UI already updated)
      await updateSettings({ preferredPaymentToken: token });
    } catch (error: any) {
      console.error('[Payment Token] Save failed:', error);
      // Show error toast if save fails
      toast({
        title: "Failed to save payment preference",
        description: "Preference not saved, please try again",
        variant: "destructive",
      });
    }
  };

  // Handler for clearing saved host preference
  const handleClearSavedHost = async () => {
    try {
      console.log('[Clear Host] Removing saved host preference');

      // Remove lastHostAddress from S5 settings
      await updateSettings({ lastHostAddress: undefined });

      // Clear preserved host address cache
      setPreservedHostAddress(undefined);

      // Show success toast
      toast({
        title: "Host preference cleared",
        description: "Using random selection for decentralization.",
      });

      // Close modal
      setShowHostSelector(false);

      console.log('[Clear Host] Host preference cleared successfully');
    } catch (error: any) {
      console.error('[Clear Host] Failed to clear preference:', error);
      toast({
        title: "Failed to clear host preference",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Show loading state for SDK initialization or settings loading
  if (isInitializing || loadingSettings) {
    return (
      <PageLoading
        message={isInitializing ? "Initializing Fabstir SDK..." : "Loading your preferences..."}
        submessage="Please wait..."
      />
    );
  }

  // Show error state for settings with retry option
  if (settingsError && !loadingSettings) {
    return (
      <SettingsErrorState
        error={settingsError}
        onRetry={() => window.location.reload()}
        onUseDefaults={() => {
          // Continue with null settings (first-time user flow)
          setShowSetupWizard(true);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      {/* Compact Header - shown when authenticated or using Base Account */}
      {(isAuthenticated || accountInfo) && !showSetupWizard && (
        <CompactHeader
          modelName={currentModelName}
          primaryBalance={primaryBalance}
          onModelClick={() => setShowModelSelector(true)}
          onBalanceClick={() => setShowDepositModal(true)}
        />
      )}

      {/* Offline Banner - shown when network connection lost */}
      {!isOnline && (isAuthenticated || accountInfo) && (
        <div className="sticky top-14 z-40 px-4 py-2 bg-background/95 backdrop-blur">
          <div className="container mx-auto max-w-6xl">
            <OfflineBanner
              pendingUpdates={0} // TODO: Get actual count from sync queue
              onRetry={() => {
                // Trigger manual refresh
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

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
                  preferredWalletType: wizardSettings.preferredWalletType,
                });

                console.log('[SetupWizard] Settings saved successfully');

                // Show success toast
                toast({
                  title: "Setup complete! 🎉",
                  description: `Preferences saved. Next: Connect wallet and discover hosts.`,
                });

                // Track analytics
                analytics.setupCompleted({
                  model: wizardSettings.selectedModel,
                  theme: wizardSettings.theme,
                  paymentToken: wizardSettings.preferredPaymentToken,
                });

                // Close wizard and show chat
                setShowSetupWizard(false);
              } catch (error: any) {
                console.error('[SetupWizard] Failed to save settings:', error);
                toast({
                  title: "Setup error",
                  description: "Settings may not have been saved. Please try again.",
                  variant: "destructive",
                });
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
                💡 <strong>Quick Setup:</strong> Connect Base Account for popup-free sessions, then fund it with your wallet
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

        {/* Automatic Host Discovery Status (when authenticated but no host) */}
        {(isAuthenticated || accountInfo) && !selectedHost && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-3">
                  {isDiscoveringHosts ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Finding available AI hosts...</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Preparing to discover hosts...</span>
                  )}
                </div>
                {/* Manual discover button for recovery */}
                {!isDiscoveringHosts && (
                  <Button
                    onClick={discoverHosts}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Discover Hosts
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* USDC Deposit (Base Account only, when balance insufficient) */}
        {accountInfo?.isUsingBaseAccount && accountInfo.primaryAccount && selectedHost && !hasEnough && (
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

        {/* Payment Mode Tabs & Chat (only when host selected) */}
        {(isAuthenticated || accountInfo) && selectedHost && (
          <div className="max-w-6xl mx-auto">
            <PaymentModeTabs defaultMode="usdc" compact={true}>
              <div className="space-y-4">
                {/* Session Controls - Compact inline layout */}
                <div className="flex items-center justify-center py-3">
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
                </div>

                {/* Chat Interface - Takes main space */}
                <ChatInterface
                  messages={messages}
                  onSendMessage={sendMessage}
                  isSending={isSendingMessage}
                  isSessionActive={isSessionActive}
                />

                {/* Session Status - Collapsible details */}
                {sessionId && (
                  <SessionStatus
                    sessionId={sessionId}
                    totalTokens={totalTokens}
                    totalCost={totalCost}
                    hostAddress={selectedHost.address}
                    model={selectedHost.models[0]}
                    selectedHost={selectedHost}
                    preferredPaymentToken={settings?.preferredPaymentToken}
                  />
                )}

                {/* Cost Dashboard - Analytics (shown when there's session data) */}
                {messages.length > 0 && (
                  <CostDashboard
                    usdcBalance={usdcBalance}
                    ethBalance={ethBalance}
                    totalCost={totalCost}
                    totalTokens={totalTokens}
                    messages={messages}
                    selectedHost={selectedHost}
                  />
                )}

                {/* Advanced Settings Panel - Collapsible */}
                <AdvancedSettingsPanel
                  sessionId={sessionId}
                  totalTokens={totalTokens}
                  totalCost={totalCost.toFixed(6)}
                  savedHostAddress={settings?.lastHostAddress || preservedHostAddress}
                  hostAddress={selectedHost?.address}
                  hostEndpoint={selectedHost?.endpoint}
                  hostStake={selectedHost?.stake}
                  onChangeHost={() => setShowHostSelector(true)}
                  primaryBalance={primaryBalance}
                  subBalance={balance}
                  onDeposit={() => setShowDepositModal(true)}
                  currentModel={currentModelName}
                  onChangeModel={() => setShowModelSelector(true)}
                  currentTheme={settings?.theme}
                  onThemeChange={handleThemeChange}
                  preferredPaymentToken={settings?.preferredPaymentToken}
                  onPaymentTokenChange={handlePaymentTokenChange}
                  isExpanded={settings?.advancedSettingsExpanded ?? false}
                  onExpandedChange={async (expanded) => {
                    try {
                      await updateSettings({ advancedSettingsExpanded: expanded });
                    } catch (error: any) {
                      console.error('[Advanced Settings] Save failed:', error);
                      // Don't show toast for panel state (too noisy)
                      // Graceful degradation: panel still works, just not persisted
                    }
                  }}
                  lastUpdated={settings?.lastUpdated}
                  onResetPreferences={async () => {
                    // Confirmation dialog is handled by SettingsPanel component
                    try {
                      // Track analytics before reset
                      analytics.settingsReset();

                      await resetSettings();
                      console.log('Preferences reset successfully');
                      // Reload to show setup wizard
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to reset preferences:', error);
                      toast({
                        title: "Failed to reset preferences",
                        description: "Please try again",
                        variant: "destructive",
                      });
                    }
                  }}
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

      {/* Model Selector Modal */}
      <ModelSelector
        open={showModelSelector}
        onOpenChange={setShowModelSelector}
        currentModel={settings?.selectedModel}
        recentModels={settings?.lastUsedModels}
        onSelectModel={async (modelId) => {
          try {
            setIsSelectingHost(true);
            console.log('[Model Selector] Selected model:', modelId);

            // Show loading toast
            toast({
              title: "Finding compatible host...",
              description: `Searching for hosts that support ${modelId}`,
            });

            // Smart host selection
            const host = await selectHostForModel(modelId);

            if (!host) {
              // No compatible hosts found
              toast({
                title: "No compatible hosts",
                description: "No hosts found for this model. Try a different model or discover more hosts.",
                variant: "destructive",
              });
              return;
            }

            // Update lastUsedModels: add to front, max 5
            const currentRecent = settings?.lastUsedModels || [];
            const updatedRecent = [
              modelId,
              ...currentRecent.filter(id => id !== modelId)
            ].slice(0, 5);

            // Save model preference to S5 (NOT the host - only save host via explicit "Change Host" action)
            await updateSettings({
              selectedModel: modelId,
              lastUsedModels: updatedRecent,
            });

            console.log('[Model Selector] Settings updated - model preference saved (host NOT saved for decentralization)');

            // Track analytics after successful save
            analytics.modelSelected(modelId, 'selector');

            // Show success toast
            toast({
              title: "Host connected",
              description: `Connected to ${host.address.slice(0, 8)}... with ${host.models.length} model(s)`,
            });

          } catch (error: any) {
            console.error('[Model Selector] Error selecting host:', error);
            toast({
              title: "Host selection failed",
              description: error.message || "Failed to select compatible host",
              variant: "destructive",
            });
          } finally {
            setIsSelectingHost(false);
          }
        }}
      />

      {/* Host Selector Modal */}
      <Dialog open={showHostSelector} onOpenChange={setShowHostSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select AI Host</DialogTitle>
            <DialogDescription>
              Choose a host manually or discover more hosts on the network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Buttons: Discover Hosts & Clear Saved Host */}
            <div className="flex justify-between items-center">
              {/* Clear Saved Host Button (only shown when host is saved) */}
              {(settings?.lastHostAddress || preservedHostAddress) ? (
                <Button
                  onClick={handleClearSavedHost}
                  variant="outline"
                  size="sm"
                >
                  Clear Saved Host
                </Button>
              ) : (
                <div></div>
              )}

              {/* Discover Hosts Button */}
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

            {/* Host Selector */}
            <HostSelector
              hosts={availableHosts}
              selectedHost={selectedHost}
              onSelect={async (host) => {
                try {
                  setSelectedHost(host);
                  // Save to settings
                  await updateSettings({ lastHostAddress: host.address });
                  // Show success toast
                  toast({
                    title: "Host selected",
                    description: `Connected to ${host.address.slice(0, 8)}...`,
                  });
                  // Close modal
                  setShowHostSelector(false);
                } catch (error: any) {
                  console.error('[Host Selector] Save failed:', error);
                  toast({
                    title: "Failed to save host preference",
                    description: "Host selected but preference not saved",
                    variant: "destructive",
                  });
                  // Still close modal and use selected host
                  setShowHostSelector(false);
                }
              }}
              isLoading={isDiscoveringHosts}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal - Placeholder */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deposit USDC</DialogTitle>
            <DialogDescription>
              Add funds to your PRIMARY account
            </DialogDescription>
          </DialogHeader>
          {accountInfo?.primaryAccount && (
            <USDCDeposit
              primaryAccount={accountInfo.primaryAccount}
              subAccount={accountInfo.subAccount}
              usdcAddress={process.env.NEXT_PUBLIC_CONTRACT_USDC_TOKEN!}
              onDepositComplete={async () => {
                console.log("Deposit complete, refreshing balances...");
                setShowDepositModal(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
