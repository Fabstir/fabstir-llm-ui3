"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Zap, Bot, Send } from "lucide-react";

interface EmptyStateProps {
  variant?: "chat" | "no-messages" | "no-host" | "no-session";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  variant = "chat",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = {
    chat: {
      icon: <Bot className="w-16 h-16 text-primary/40" />,
      title: "Ready to Chat",
      description:
        "Start a conversation with an AI model on the decentralized Fabstir network. Your messages are secure and private.",
      gradient: "from-primary/10 via-secondary/10 to-accent/10",
    },
    "no-messages": {
      icon: <MessageSquare className="w-16 h-16 text-primary/40" />,
      title: "No Messages Yet",
      description:
        "Send your first message to start the conversation. The AI will respond with helpful and accurate information.",
      gradient: "from-primary/10 to-secondary/10",
    },
    "no-host": {
      icon: <Zap className="w-16 h-16 text-warning/60" />,
      title: "No Host Selected",
      description:
        "Discover available AI hosts on the network to start chatting. Each host offers different models and capabilities.",
      gradient: "from-warning/10 to-secondary/10",
    },
    "no-session": {
      icon: <Sparkles className="w-16 h-16 text-secondary/60" />,
      title: "No Active Session",
      description:
        "Create a new session to start chatting. Sessions are secured with blockchain payments and provide context-aware conversations.",
      gradient: "from-secondary/10 to-accent/10",
    },
  };

  const currentConfig = config[variant];
  const displayTitle = title || currentConfig.title;
  const displayDescription = description || currentConfig.description;

  return (
    <div
      className={cn(
        "flex items-center justify-center p-8 md:p-12",
        className
      )}
    >
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        {/* Icon with gradient background */}
        <div className="relative inline-flex">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br blur-3xl opacity-30 rounded-full",
              currentConfig.gradient
            )}
          />
          <div className="relative bg-card border-2 border-border/50 rounded-full p-6">
            {currentConfig.icon}
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-3">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground">
            {displayTitle}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {displayDescription}
          </p>
        </div>

        {/* Action button */}
        {action && (
          <Button
            onClick={action.onClick}
            size="lg"
            className="gap-2 mt-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 hover:scale-105"
          >
            {action.icon || <Send className="w-4 h-4" />}
            {action.label}
          </Button>
        )}

        {/* Decorative elements */}
        <div className="flex justify-center gap-2 pt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-secondary/40 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

export function ChatEmptyState({ onSendMessage }: { onSendMessage?: () => void }) {
  return (
    <EmptyState
      variant="no-messages"
      action={
        onSendMessage
          ? {
              label: "Send First Message",
              onClick: onSendMessage,
              icon: <Send className="w-4 h-4" />,
            }
          : undefined
      }
    />
  );
}
