// app/page.tsx
'use client'

import { GameUI } from '@/components/game/GameUI'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { user, isGuest, isLoading, userId } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || isLoading) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  // 🔥 Гость всегда использует ID = 'guest'
  // Это НЕ создаёт новых пользователей в БД
  const finalUserId = isGuest ? 'guest' : userId

  return (
    <div className="w-full h-screen overflow-hidden bg-zinc-950">
      <GameUI userId={finalUserId} />
    </div>
  )
}