"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo, ShimmerText } from "@/components/brand";
import { cn } from "@/lib/utils";
import { MessageSquare, Settings, Home } from "lucide-react";
import { useFabstirSDK } from "@/hooks/use-fabstir-sdk";

export function AppHeader() {
  const pathname = usePathname();
  const { userAddress, isAuthenticated, isMockMode } = useFabstirSDK();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
          >
            <Logo size="md" animated />
            <div className="flex flex-col">
              <span className="text-xl font-bold">
                <ShimmerText>Fabstir LLM Chat</ShimmerText>
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
                P2P AI Marketplace
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300",
                    "hover:scale-105 active:scale-95",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-transform", isActive && "animate-bounce-subtle")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Wallet Connection & Status */}
          <div className="flex items-center gap-3">
            {isMockMode && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600 hidden sm:flex">
                Mock Mode
              </Badge>
            )}

            {isAuthenticated && userAddress && (
              <Badge variant="outline" className="hidden sm:flex font-mono text-xs">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </Badge>
            )}

            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
