// app/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { Inter } from 'next/font/google'
import './global.css'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initTelegram = async () => {
      if (typeof window === 'undefined') return

      try {
        const isTelegram = !!(
          window.Telegram?.WebApp?.initData ||
          window.location.search.includes('tgWebAppData')
        )

        if (isTelegram && window.Telegram?.WebApp) {
          console.log('📱 Telegram WebApp detected')
          window.Telegram.WebApp.ready()
          window.Telegram.WebApp.expand()
        } else {
          console.log('📱 Not in Telegram environment - Demo mode')
        }
      } catch (error) {
        console.error('❌ Telegram initialization error:', error)
      } finally {
        setIsReady(true)
      }
    }

    initTelegram()
  }, [])

  return (
    <html
      lang="ru"
      className={`${inter.variable} antialiased`}
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-zinc-950 text-zinc-50 min-h-screen antialiased overflow-hidden">
        <main className="relative flex flex-col h-screen max-w-md mx-auto bg-zinc-950 shadow-2xl border-x border-zinc-900 overflow-hidden w-full">
          {isReady ? (
            children
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Загрузка...</p>
              </div>
            </div>
          )}
        </main>
      </body>
    </html>
  )
}
