import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/toaster";
import { SkipNav } from "@/components/skip-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fabstir LLM Chat",
  description: "Democratizing AI, One Inference at a Time - P2P LLM Marketplace",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fabstir",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Fabstir LLM Chat",
    title: "Fabstir LLM Chat",
    description: "Democratizing AI, One Inference at a Time",
  },
  twitter: {
    card: "summary",
    title: "Fabstir LLM Chat",
    description: "Democratizing AI, One Inference at a Time",
  },
};

export const viewport = {
  themeColor: "#540074",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SkipNav />
        <Providers>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
