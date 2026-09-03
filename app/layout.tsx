// app/layout.tsx
'use client';

import { useEffect, useState } from 'react';
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
  const [isTelegramReady, setIsTelegramReady] = useState(false);

  useEffect(() => {
    const initTelegram = async () => {
      if (typeof window === 'undefined') return;
      
      const isTelegram = !!(window.Telegram?.WebApp?.initData || 
                          window.location.search.includes('tgWebAppData'));
      
      if (!isTelegram) {
        console.log('📱 Not in Telegram environment - Demo mode');
        setIsTelegramReady(true);
        return;
      }

      try {
        const sdk = await import('@telegram-apps/sdk-react');
        await sdk.init();
        
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
        }
        
        setIsTelegramReady(true);
      } catch (error) {
        console.error('❌ Telegram initialization error:', error);
        setIsTelegramReady(true);
      }
    };

    initTelegram();
  }, []);

  return (
    <html lang="ru" className={`${inter.variable} antialiased`}>
      <body className="bg-zinc-950 text-zinc-50 min-h-screen antialiased overflow-hidden">
        <main className="relative flex flex-col h-screen max-w-md mx-auto bg-zinc-950 shadow-2xl border-x border-zinc-900 overflow-hidden w-full">
          {children}
        </main>
      </body>
    </html>
  );
}