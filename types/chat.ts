// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  tokens?: number;
}
