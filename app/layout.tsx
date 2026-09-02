// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { Inter } from "next/font/google";
import "./global.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // Безопасная инициализация на самом верхнем уровне приложения (Client-side)
    if (typeof window !== 'undefined') {
      const isTelegram = window.location.search.includes('tgWeb') || (window as any).Telegram?.WebApp?.initData;
      if (isTelegram) {
        // Динамически и безопасно импортируем SDK внутри браузера смартфона
        import('@telegram-apps/sdk-react').then((sdk) => {
          try {
            sdk.init();
            console.log('✅ [TELEGRAM GLOBAL] Контекст оплат Stars успешно зафиксирован!');
          } catch (e) {
            console.error('Ошибка инициализации Telegram SDK:', e);
          }
        });
      }
    }
  }, []);

  return (
    <html lang="ru" className={`${inter.variable} antialiased`}>
      <body className="bg-zinc-950 text-zinc-50 min-h-screen antialiased">
        <main className="relative flex flex-col min-h-screen max-w-md mx-auto bg-zinc-950 shadow-2xl border-x border-zinc-900 overflow-hidden w-full">
          <div className="flex-1 w-full p-4 pb-24 flex flex-col justify-between">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
