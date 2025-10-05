"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Wallet, DollarSign } from "lucide-react";

interface USDCDepositProps {
  primaryAccount: string;
  subAccount?: string;
  usdcAddress: string;
  onDepositComplete?: () => void;
}

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

export function USDCDeposit({ primaryAccount, subAccount, usdcAddress, onDepositComplete }: USDCDepositProps) {
  const [depositAmount, setDepositAmount] = useState("10");
  const [isDepositing, setIsDepositing] = useState(false);
  const [eoaBalance, setEoaBalance] = useState<string | null>(null);
  const [primaryBalance, setPrimaryBalance] = useState<string | null>(null);
  const [subBalance, setSubBalance] = useState<string | null>(null);

  const { address: eoaAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  // Fetch balances using ethers.js (no wallet connection required)
  const fetchBalances = async () => {
    if (!primaryAccount || !usdcAddress) {
      console.log("❌ Cannot fetch balances - missing required params");
      return;
    }

    try {
      console.log("Fetching USDC balances for:", { eoaAddress, primaryAccount, subAccount, usdcAddress });

      // Create ethers provider using RPC URL (no wallet needed for reading)
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider);

      const balanceFetches = [
        usdcContract.balanceOf(primaryAccount),
      ];

      // Add EOA balance if wallet connected
      if (eoaAddress) {
        balanceFetches.unshift(usdcContract.balanceOf(eoaAddress));
      }

      // Add sub-account balance if available
      if (subAccount) {
        balanceFetches.push(usdcContract.balanceOf(subAccount));
      }

      const balances = await Promise.all(balanceFetches);

      let balanceIndex = 0;

      // If EOA wallet connected, first balance is EOA
      if (eoaAddress) {
        const eoaFormatted = ethers.formatUnits(balances[balanceIndex], 6);
        setEoaBalance(eoaFormatted);
        balanceIndex++;
      } else {
        setEoaBalance(null); // No EOA wallet
      }

      // Primary account balance
      const primaryFormatted = ethers.formatUnits(balances[balanceIndex], 6);
      setPrimaryBalance(primaryFormatted);
      balanceIndex++;

      // Sub-account balance
      if (subAccount) {
        const subFormatted = ethers.formatUnits(balances[balanceIndex], 6);
        setSubBalance(subFormatted);
      } else {
        setSubBalance("0");
      }

      console.log("USDC Balances fetched:", {
        eoaBalance: eoaAddress ? ethers.formatUnits(balances[0], 6) : "N/A (no wallet)",
        primaryBalance: primaryFormatted,
      });
    } catch (error: any) {
      console.error("Failed to fetch USDC balances:", error);
      console.error("Error details:", error.message);
      // Set to 0 on error so UI shows something
      if (eoaAddress) setEoaBalance("0");
      setPrimaryBalance("0");
      setSubBalance("0");
    }
  };

  // Fetch on mount and when addresses change (no EOA wallet required)
  useEffect(() => {
    if (usdcAddress && primaryAccount) {
      fetchBalances();
    }
  }, [eoaAddress, primaryAccount, usdcAddress, subAccount]);

  const handleDeposit = async () => {
    if (!walletClient || !eoaAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your EOA wallet first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);

    try {
      const amountWei = ethers.parseUnits(depositAmount, 6);

      // Check EOA has enough USDC
      if (eoaBalance && parseFloat(eoaBalance) < parseFloat(depositAmount)) {
        throw new Error(
          `Insufficient USDC. You have ${eoaBalance} USDC but need ${depositAmount} USDC`
        );
      }

      console.log("💸 Depositing to primary account:", primaryAccount);
      console.log("Amount:", depositAmount, "USDC (", amountWei.toString(), "wei)");

      // Use ethers.js for the transaction (more reliable than viem for this)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer);

      toast({
        title: "Transaction Pending",
        description: "Please approve in your wallet...",
      });

      // Transfer USDC from EOA to primary account
      const tx = await usdcContract.transfer(primaryAccount, amountWei);

      console.log("Transfer TX:", tx.hash);

      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });

      // Wait for 3 confirmations
      const receipt = await tx.wait(3);

      console.log("✅ Transfer confirmed:", receipt);

      toast({
        title: "Deposit Successful! 🎉",
        description: `Deposited ${depositAmount} USDC to Base primary account`,
      });

      // Refresh balances
      await fetchBalances();

      // Notify parent
      if (onDepositComplete) {
        onDepositComplete();
      }
    } catch (error: any) {
      console.error("❌ Deposit failed:", error);

      let errorMessage = "Failed to deposit USDC";
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Deposit Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  // Check if regular wallet is connected
  const needsWalletConnection = !eoaAddress || !walletClient;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Deposit USDC to Your Account
        </CardTitle>
        <CardDescription>
          Transfer USDC from your connected wallet to your Base Account for popup-free AI sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Connection Warning */}
        {needsWalletConnection && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-600 mb-1">Connect Your Wallet to Deposit</h4>
                <p className="text-sm text-yellow-600/90 mb-3">
                  To deposit USDC, you need to connect a regular wallet (MetaMask, Rainbow, etc.) using the
                  <span className="font-semibold"> "Connect Wallet" </span>
                  button at the top of the page.
                </p>
                <div className="text-xs text-yellow-600/80 space-y-1">
                  <p>📌 <strong>Workflow:</strong></p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>✅ Base Account connected (popup-free transactions)</li>
                    <li>❌ Connect regular wallet via "Connect Wallet" button</li>
                    <li>Deposit USDC from regular wallet → Base primary account</li>
                    <li>Start sessions (popup-free!)</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="text-xs text-yellow-600/70 p-3 bg-yellow-500/5 rounded border border-yellow-500/20">
              💡 <strong>Tip:</strong> Base Account enables popup-free transactions. Connect your wallet to fund it with USDC.
            </div>
          </div>
        )}
        {/* Balance Display */}
        <div className="space-y-3">
          {/* Connected Wallet Balance */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Connected Wallet (Source)
            </div>
            <div className="font-mono text-lg">
              {eoaAddress ? (
                eoaBalance !== null ? `${eoaBalance} USDC` : "Loading..."
              ) : (
                <span className="text-muted-foreground">Not Connected</span>
              )}
            </div>
            {eoaAddress ? (
              <div className="text-xs text-muted-foreground mt-1">
                {eoaAddress.slice(0, 6)}...{eoaAddress.slice(-4)}
              </div>
            ) : (
              <div className="text-xs text-yellow-600 mt-1">
                ⚠️ Use "Connect Wallet" button above to deposit
              </div>
            )}
          </div>

          {/* Base Account Balance */}
          <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
            <div className="text-xs text-primary mb-1 font-semibold">
              Base Account Balance
            </div>
            <div className="font-mono text-2xl">
              {primaryBalance !== null ? `${primaryBalance} USDC` : "Loading..."}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {primaryAccount.slice(0, 6)}...{primaryAccount.slice(-4)}
            </div>
            <div className="text-xs text-green-600 mt-2 font-semibold">
              💰 Deposit USDC here to start chatting
            </div>
          </div>
        </div>

        {/* Deposit Controls */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount (USDC)"
              disabled={isDepositing}
              step="0.1"
              min="0"
            />
          </div>
          <Button
            onClick={handleDeposit}
            disabled={isDepositing || !eoaAddress}
            className="gap-2"
          >
            {isDepositing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : (
              <>
                Deposit <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button onClick={fetchBalances} variant="outline" size="icon" disabled={isDepositing}>
            <Loader2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/50 rounded-lg">
          <p className="font-semibold text-foreground">📝 How Base Account Works:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li><strong>PRIMARY Account</strong> (Smart Wallet) - Holds your USDC</li>
            <li><strong>SUB Account</strong> (Spender) - Sends transactions using PRIMARY's USDC</li>
            <li>Spend permissions let SUB use PRIMARY's funds without popups!</li>
          </ol>
          <p className="text-green-600">✨ Deposit USDC to PRIMARY account above, then enjoy popup-free sessions!</p>
        </div>

        {/* Minimum requirement warning */}
        {primaryBalance !== null && parseFloat(primaryBalance) < 2 && (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            ⚠️ Need at least $2 USDC in primary account to start a session
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
