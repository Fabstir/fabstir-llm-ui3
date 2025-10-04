'use client';

import Image from 'next/image';
import { ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompactHeaderProps {
  modelName?: string;
  primaryBalance?: string;
  onModelClick?: () => void;
  onBalanceClick?: () => void;
}

export function CompactHeader({
  modelName = 'No model selected',
  primaryBalance,
  onModelClick,
  onBalanceClick,
}: CompactHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left: Logo/Branding */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo-with-text.png"
            alt="Fabstir"
            width={120}
            height={30}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* Center: Model Name (Clickable) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onModelClick}
          className="flex items-center gap-2 font-medium"
        >
          <span className="text-sm">{modelName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>

        {/* Right: PRIMARY Balance (Clickable) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBalanceClick}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-mono">
            {primaryBalance !== undefined && primaryBalance !== null
              ? `${parseFloat(primaryBalance).toFixed(2)} USDC`
              : 'Loading...'}
          </span>
        </Button>
      </div>
    </header>
  );
}
