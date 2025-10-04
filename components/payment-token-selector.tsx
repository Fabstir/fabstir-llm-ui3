'use client';

import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaymentTokenSelectorProps {
  currentToken?: 'USDC' | 'ETH';
  onSelectToken: (token: 'USDC' | 'ETH') => void;
}

export function PaymentTokenSelector({
  currentToken = 'USDC',
  onSelectToken,
}: PaymentTokenSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={currentToken === 'USDC' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectToken('USDC')}
        className={cn(
          "flex-1 transition-all",
          currentToken === 'USDC' && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        USDC
      </Button>

      <Button
        variant={currentToken === 'ETH' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectToken('ETH')}
        className={cn(
          "flex-1 transition-all",
          currentToken === 'ETH' && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        ETH
      </Button>
    </div>
  );
}
