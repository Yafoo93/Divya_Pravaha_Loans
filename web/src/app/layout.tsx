import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Divya Pravaha Loan Management",
  description: "Divya Pravaha loan management system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="bg-primary fixed top-2 left-2 z-[100] -translate-y-20 rounded-lg px-4 py-2 text-sm font-bold text-white transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
