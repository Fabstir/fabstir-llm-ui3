// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Settings, Server, Wallet, Zap, BarChart3, RotateCcw, DollarSign, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PaymentTokenSelector } from '@/components/payment-token-selector';
import { ThemeSelector } from '@/components/theme-selector';
import { SettingsPanel } from '@/components/settings-panel';

interface AdvancedSettingsPanelProps {
  // Session details
  sessionId?: bigint | null;
  totalTokens?: number;
  totalCost?: string;

  // Host information (only shown if explicitly saved to S5)
  savedHostAddress?: string; // From settings.lastHostAddress (S5 storage)
  hostAddress?: string; // Current selected host (may be temporary)
  hostEndpoint?: string;
  hostStake?: bigint;
  onChangeHost?: () => void;

  // Account balances
  primaryBalance?: string;
  subBalance?: string;
  onDeposit?: () => void;

  // Model selection
  currentModel?: string;
  onChangeModel?: () => void;

  // Preferences
  currentTheme?: 'light' | 'dark' | 'auto';
  onThemeChange?: (theme: 'light' | 'dark' | 'auto') => void;
  preferredPaymentToken?: 'USDC' | 'ETH';
  onPaymentTokenChange?: (token: 'USDC' | 'ETH') => void;

  // Settings
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  lastUpdated?: number;

  // Reset
  onResetPreferences?: () => void;
}

export function AdvancedSettingsPanel({
  sessionId,
  totalTokens = 0,
  totalCost = '0.00',
  savedHostAddress,
  hostAddress,
  hostEndpoint,
  hostStake,
  onChangeHost,
  primaryBalance,
  subBalance,
  onDeposit,
  currentModel,
  onChangeModel,
  currentTheme,
  onThemeChange,
  preferredPaymentToken,
  onPaymentTokenChange,
  isExpanded: controlledExpanded,
  onExpandedChange,
  lastUpdated,
  onResetPreferences,
}: AdvancedSettingsPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsExpanded = onExpandedChange || setInternalExpanded;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-4 h-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Advanced Settings</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t"
        >
          <div className="p-4 space-y-6">
            {/* Session Details */}
            {sessionId && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4" />
                  Session Details
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Session ID</div>
                    <div className="font-mono text-xs">
                      {sessionId.toString().slice(0, 12)}...
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Total Tokens</div>
                    <div className="font-semibold">{totalTokens.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Total Cost</div>
                    <div className="font-semibold">${totalCost}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Status</div>
                    <Badge variant="default" className="w-fit">Active</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Host Information - Only shown if explicitly saved to S5 */}
            {onChangeHost && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Server className="h-4 w-4" />
                      Host Selection
                    </div>
                    <Button variant="outline" size="sm" onClick={onChangeHost}>
                      Change Host
                    </Button>
                  </div>
                  {savedHostAddress ? (
                    // Show saved host from S5 storage
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">Saved to S5</Badge>
                        {hostAddress && savedHostAddress.toLowerCase() !== hostAddress.toLowerCase() && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                            Not currently used
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Address</div>
                        <div className="font-mono text-xs break-all">{savedHostAddress}</div>
                      </div>
                      {hostAddress && savedHostAddress.toLowerCase() === hostAddress.toLowerCase() && (
                        <>
                          {hostEndpoint && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground">Endpoint</div>
                              <div className="font-mono text-xs break-all">{hostEndpoint}</div>
                            </div>
                          )}
                          {hostStake && (
                            <div className="space-y-1">
                              <div className="text-muted-foreground">Stake</div>
                              <div className="font-semibold">
                                {(Number(hostStake) / 1e18).toLocaleString()} FAB
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // No saved host - show message
                    <div className="text-xs text-muted-foreground">
                      No host saved. Click "Change Host" to select and save a host permanently.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Account Balances */}
            {(primaryBalance || subBalance) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Wallet className="h-4 w-4" />
                      Account Balances
                    </div>
                    {onDeposit && (
                      <Button variant="outline" size="sm" onClick={onDeposit}>
                        Deposit More
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {primaryBalance && (
                      <div className="space-y-1">
                        <div className="text-muted-foreground">PRIMARY Account</div>
                        <div className="font-semibold">{primaryBalance} USDC</div>
                      </div>
                    )}
                    {subBalance && (
                      <div className="space-y-1">
                        <div className="text-muted-foreground">SUB Account</div>
                        <div className="font-semibold">{subBalance} USDC</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Model Selection */}
            {currentModel && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Zap className="h-4 w-4" />
                      AI Model
                    </div>
                    {onChangeModel && (
                      <Button variant="outline" size="sm" onClick={onChangeModel}>
                        Select Model
                      </Button>
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Current Model</div>
                    <div className="font-mono text-xs mt-1">{currentModel}</div>
                  </div>
                </div>
              </>
            )}

            {/* Payment Preference */}
            {onPaymentTokenChange && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <DollarSign className="h-4 w-4" />
                    Payment Token
                  </div>
                  <PaymentTokenSelector
                    currentToken={preferredPaymentToken}
                    onSelectToken={onPaymentTokenChange}
                  />
                  <div className="text-xs text-muted-foreground">
                    Default payment method for new sessions
                  </div>
                </div>
              </>
            )}

            {/* Theme */}
            {onThemeChange && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Palette className="h-4 w-4" />
                    Theme
                  </div>
                  <ThemeSelector
                    currentTheme={currentTheme}
                    onSelectTheme={onThemeChange}
                  />
                  <div className="text-xs text-muted-foreground">
                    Choose your preferred appearance
                  </div>
                </div>
              </>
            )}

            {/* Usage Analytics - Placeholder */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4" />
                  Usage Analytics
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  View Details →
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Track your AI usage, costs, and performance over time
              </div>
            </div>

            {/* Settings Panel with Summary and Reset */}
            <Separator />
            <SettingsPanel
              selectedModel={currentModel}
              preferredPaymentToken={preferredPaymentToken}
              theme={currentTheme}
              lastUpdated={lastUpdated}
              onResetPreferences={onResetPreferences}
            />
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
