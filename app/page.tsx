"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Wallet,
  Zap,
  Shield,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Wallet,
      title: "Web3 Native",
      description: "Connect with MetaMask, Coinbase Wallet, or any WalletConnect wallet",
    },
    {
      icon: Shield,
      title: "Decentralized",
      description: "Chat directly with AI hosts on the P2P network without intermediaries",
    },
    {
      icon: DollarSign,
      title: "Flexible Payments",
      description: "Pay with USDC stablecoin or native ETH - your choice",
    },
    {
      icon: Zap,
      title: "Real-time Analytics",
      description: "Track token usage, costs, and session metrics in real-time",
    },
  ];

  const steps = [
    { step: "1", title: "Connect Wallet", description: "Connect your Web3 wallet" },
    { step: "2", title: "Select Host", description: "Discover and choose an AI host" },
    { step: "3", title: "Start Session", description: "Deposit funds and start chatting" },
    { step: "4", title: "Chat with AI", description: "Have conversations with AI models" },
  ];

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="mx-auto">
              Powered by Base Sepolia Testnet
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Decentralized AI
              </span>
              <br />
              Conversations
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Chat with AI models on the Fabstir P2P marketplace. Pay-per-use with crypto. No subscriptions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/chat">
                <Button size="lg" className="text-lg px-8 py-6 group">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Chatting
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Settings
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Fabstir?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the future of AI interactions with true decentralization and transparency
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <Icon className="h-10 w-10 text-primary mb-2" />
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started with Fabstir in just four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="relative"
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {item.step}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/chat">
              <Button size="lg" className="text-lg px-8 py-6">
                <MessageSquare className="mr-2 h-5 w-5" />
                Go to Chat
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
