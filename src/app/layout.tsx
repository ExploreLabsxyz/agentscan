'use client'
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ArrowUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation"


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// export const metadata: Metadata = {
//   title: "Create Next App",
//   description: "Generated by create next app",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [searchQuery,setSearchQuery] = useState('')
  const router = useRouter();

  const handleButtonClick = () => {
    router.push('/');
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        
      {/* Top Navigation */}
      <header className="w-full border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-green-600">
            <span className="font-medium">$OLAS: $1.24</span>
            <ArrowUp className="h-4 w-4 ml-1" />
            <span className="text-sm ml-1">2.5%</span>
          </div>
        </div>
      </header>
        {children}
      </body>
    </html>
  );
}
