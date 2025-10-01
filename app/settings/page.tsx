"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Save, RotateCcw, DollarSign, Hash, Clock } from "lucide-react";

interface SessionSettings {
  depositAmount: string;
  pricePerToken: number;
  proofInterval: number;
  duration: number;
}

const DEFAULT_SETTINGS: SessionSettings = {
  depositAmount: "2.00",
  pricePerToken: 2000,
  proofInterval: 100,
  duration: 86400, // 24 hours
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fabstir-session-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem("fabstir-session-settings", JSON.stringify(settings));

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your session settings have been saved successfully.",
      });
    }, 500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("fabstir-session-settings");
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to defaults.",
    });
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your default session parameters for AI chats
        </p>
      </div>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Session Configuration</CardTitle>
          <CardDescription>
            Set default values for new chat sessions. These can be adjusted per-session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deposit Amount */}
          <div className="space-y-2">
            <Label htmlFor="deposit" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Default Deposit Amount (USDC)
            </Label>
            <Input
              id="deposit"
              type="number"
              step="0.01"
              min="0.01"
              value={settings.depositAmount}
              onChange={(e) =>
                setSettings({ ...settings, depositAmount: e.target.value })
              }
              placeholder="2.00"
            />
            <p className="text-sm text-muted-foreground">
              Amount of USDC to deposit when starting a session (minimum: 0.01)
            </p>
          </div>

          {/* Price Per Token */}
          <div className="space-y-2">
            <Label htmlFor="pricePerToken" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tokens Per USDC
            </Label>
            <Input
              id="pricePerToken"
              type="number"
              step="100"
              min="100"
              value={settings.pricePerToken}
              onChange={(e) =>
                setSettings({ ...settings, pricePerToken: parseInt(e.target.value) })
              }
              placeholder="2000"
            />
            <p className="text-sm text-muted-foreground">
              Number of AI tokens you get per 1 USDC (default: 2000)
            </p>
          </div>

          {/* Proof Interval */}
          <div className="space-y-2">
            <Label htmlFor="proofInterval" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Proof Interval (tokens)
            </Label>
            <Input
              id="proofInterval"
              type="number"
              step="10"
              min="10"
              value={settings.proofInterval}
              onChange={(e) =>
                setSettings({ ...settings, proofInterval: parseInt(e.target.value) })
              }
              placeholder="100"
            />
            <p className="text-sm text-muted-foreground">
              Submit payment proof every N tokens (default: 100)
            </p>
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session Duration (seconds)
            </Label>
            <Input
              id="duration"
              type="number"
              step="3600"
              min="3600"
              value={settings.duration}
              onChange={(e) =>
                setSettings({ ...settings, duration: parseInt(e.target.value) })
              }
              placeholder="86400"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Maximum session duration (default: 86400 = 24 hours)
              </p>
              <Badge variant="outline" className="text-xs">
                {Math.floor(settings.duration / 3600)} hours
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex-1 sm:flex-none">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-lg">About These Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Deposit Amount</strong>: The USDC amount locked at session start. Unused funds are returned.
          </p>
          <p>
            • <strong>Tokens Per USDC</strong>: Cost efficiency ratio. Higher = more tokens per dollar.
          </p>
          <p>
            • <strong>Proof Interval</strong>: How often to verify token usage on-chain. Lower = more secure, more gas.
          </p>
          <p>
            • <strong>Session Duration</strong>: Maximum time before automatic session end.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
