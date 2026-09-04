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
      
      try {
        // Проверяем, есть ли Telegram WebApp
        const isTelegram = !!(window.Telegram?.WebApp?.initData || 
                            window.location.search.includes('tgWebAppData'));
        
        if (isTelegram && window.Telegram?.WebApp) {
          console.log('📱 Telegram WebApp detected');
          
          // ✅ Инициализируем WebApp
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
          
          // ✅ Пробуем импортировать SDK только если он установлен
          try {
            const sdk = await import('@telegram-apps/sdk-react');
            if (sdk && sdk.init) {
              await sdk.init();
              console.log('✅ Telegram SDK initialized');
            }
          } catch (sdkError) {
            // SDK не установлен - это нормально для демо-режима
            console.log('ℹ️ Telegram SDK not installed, using WebApp directly');
          }
        } else {
          console.log('📱 Not in Telegram environment - Demo mode');
        }
      } catch (error) {
        console.error('❌ Telegram initialization error:', error);
      } finally {
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