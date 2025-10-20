// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

export function useGlobalKeyboardShortcuts(
  onNewChat?: () => void,
  onHelp?: () => void,
  onSettings?: () => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      ctrlKey: true,
      action: () => onNewChat?.(),
      description: "New chat session",
    },
    {
      key: "/",
      ctrlKey: true,
      action: () => onHelp?.(),
      description: "Show keyboard shortcuts",
    },
    {
      key: ",",
      ctrlKey: true,
      action: () => onSettings?.(),
      description: "Open settings",
    },
    {
      key: "Escape",
      action: () => {
        // Close any open modals
        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();
      },
      description: "Close modal/unfocus",
    },
  ];

  return useKeyboardShortcuts(shortcuts);
}
