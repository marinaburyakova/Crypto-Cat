// app/page.tsx
'use client'

import { GameUI } from '@/components/game/GameUI'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
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

  // 🔥 Всегда показываем игру, даже без авторизации
  // Просто передаём userId = 'demo' для демо-режима
  const userId = user?.id || 'demo'

  return (
    <div className="w-full h-screen overflow-hidden bg-zinc-950 relative">
      {/* Демо-баннер (только для неавторизованных) */}
      {!user && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              🎮 Демо-режим
            </span>
            <span className="text-white/60 text-xs">
              Прогресс не сохраняется
            </span>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            🔐 Войти
          </button>
        </div>
      )}

      <GameUI userId={userId} />
    </div>
  )
}
