// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { Inter } from "next/font/google";
import "./global.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Проверяем, что мы в Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        console.log('✅ Telegram WebApp initialized');
      } catch (error) {
        console.error('❌ Telegram WebApp error:', error);
      }
    } else {
      console.log('📱 Not in Telegram environment - Demo mode');
    }
  }, []);

  return (
    <div className="relative flex flex-col h-screen max-w-md mx-auto bg-zinc-950 shadow-2xl border-x border-zinc-900 overflow-hidden w-full">
      {children}
    </div>
  );
}