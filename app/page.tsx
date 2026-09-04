// app/page.tsx
'use client'

import Script from "next/script";
import { GameUI } from '@/components/game/GameUI'

export default function HomePage() {
  const userId = 'guest_user_demo_1337'

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <GameUI userId={userId} />
    </>
  )
}