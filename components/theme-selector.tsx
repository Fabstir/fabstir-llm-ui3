'use client';

import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  currentTheme?: 'light' | 'dark' | 'auto';
  onSelectTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export function ThemeSelector({
  currentTheme = 'auto',
  onSelectTheme,
}: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        variant={currentTheme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectTheme('light')}
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-3 transition-all",
          currentTheme === 'light' && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <Sun className="h-4 w-4" />
        <span className="text-xs">Light</span>
      </Button>

      <Button
        variant={currentTheme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectTheme('dark')}
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-3 transition-all",
          currentTheme === 'dark' && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <Moon className="h-4 w-4" />
        <span className="text-xs">Dark</span>
      </Button>

      <Button
        variant={currentTheme === 'auto' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectTheme('auto')}
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-3 transition-all",
          currentTheme === 'auto' && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <Laptop className="h-4 w-4" />
        <span className="text-xs">Auto</span>
      </Button>
    </div>
  );
}
