import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

import GlobalBackground from "@/components/GlobalBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: "PIECHEM - Smart Learning Platform",
  description: "PIECHEM Online Chemistry Exam and Assessment Platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#030f17]`}
    >
      <body className="dark min-h-full flex flex-col bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black text-slate-100 relative selection:bg-cyan-500/30 selection:text-cyan-200">
        <GlobalBackground />
        <div className="relative z-10 flex flex-col flex-1 min-h-full">
          {children}
        </div>
        
      </body>
    </html>
  );
}
