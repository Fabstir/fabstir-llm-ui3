// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="text-center space-y-6 p-8">
        {/* 404 */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl opacity-30 rounded-full" />
          <h1 className="relative text-9xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
