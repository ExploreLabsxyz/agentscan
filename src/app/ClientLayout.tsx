"use client";

import React, { useEffect } from "react";

import Link from "next/link";
import { initAmplitude } from "@/lib/amplitude";
import AnimatedUnicorn from "@/components/AnimatedUnicorn";

interface ClientLayoutProps {
  children: React.ReactNode;
  geistSansVariable: string;
  geistMonoVariable: string;
}

export default function ClientLayout({
  children,
  geistSansVariable,
  geistMonoVariable,
}: ClientLayoutProps) {
  useEffect(() => {
    initAmplitude();
  }, []);

  return (
    <body
      className={`${geistSansVariable} ${geistMonoVariable} min-h-screen flex flex-col`}
    >
      <div className="fixed top-0 left-0 w-full bg-transparent z-50">
        <div className="py-2">
          <Link href="/" className="text-xl font-bold">
            <div className="flex flex-row max-h-16 items-center space-x-0">
              <AnimatedUnicorn scale={0.45} />
              UniChat
            </div>
          </Link>
        </div>
      </div>

      <main className="flex-1 mt-20 flex flex-col">{children}</main>

      <footer className="w-full py-4 bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            UniChat is a community-driven informational site separate to Uniswap
            or any related products & services. All information and chats are
            not financial advice. Use at your own risk.
          </p>
        </div>
      </footer>
    </body>
  );
}
