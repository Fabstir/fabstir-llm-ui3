// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatEmptyState, ThinkingAnimation } from "@/components/brand";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isSending: boolean;
  isSessionActive: boolean;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isSending,
  isSessionActive,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !isSessionActive) return;

    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="flex flex-col h-[70vh] md:h-[65vh] lg:h-[70vh] w-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
            >
              <ChatEmptyState />
              <p className="mt-4 text-sm text-muted-foreground max-w-md">
                {!isSessionActive
                  ? "Start a session to begin chatting with AI"
                  : "Send your first message to start the conversation"}
              </p>
            </motion.div>
          )}

          {messages.map((message, idx) => (
            <motion.div
              key={`${message.timestamp}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3 mb-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar
                className={cn(
                  "w-8 h-8",
                  message.role === "user" && "bg-primary",
                  message.role === "assistant" && "bg-secondary",
                  message.role === "system" && "bg-muted"
                )}
              >
                <AvatarFallback>
                  {message.role === "user" && <User className="w-4 h-4" />}
                  {message.role === "assistant" && <Bot className="w-4 h-4" />}
                  {message.role === "system" && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "flex-1 rounded-lg p-3 md:p-4",
                  message.role === "user" &&
                    "bg-primary text-primary-foreground ml-8 md:ml-12",
                  message.role === "assistant" && "bg-muted mr-8 md:mr-12",
                  message.role === "system" && "bg-accent/50 text-center"
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>

                {message.tokens && (
                  <div className="mt-2 text-xs opacity-70">
                    <Badge variant="outline">
                      {message.tokens} tokens (~$
                      {((message.tokens * 2000) / 1000000).toFixed(4)})
                    </Badge>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isSending && (
            <motion.div
              key="loading-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-3"
            >
              <Avatar className="w-8 h-8 bg-secondary">
                <AvatarFallback>
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg p-3 md:p-4 bg-muted mr-8 md:mr-12">
                <ThinkingAnimation />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area - Always Visible at Bottom */}
      <div className="border-t p-3 md:p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isSessionActive
                ? "Start a session first..."
                : "Type your message... (Enter to send, Shift+Enter for new line)"
            }
            disabled={!isSessionActive || isSending}
            rows={2}
            className="resize-none min-h-[60px]"
          />
          <Button
            type="submit"
            disabled={!isSessionActive || !input.trim() || isSending}
            size="lg"
            className="h-auto px-4 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/50"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </form>

        {!isSessionActive && (
          <p className="mt-2 text-xs md:text-sm text-muted-foreground text-center">
            Please start a session to begin chatting
          </p>
        )}
      </div>
    </Card>
  );
}
