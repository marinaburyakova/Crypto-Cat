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

  const userId = user?.id || 'demo'

  return (
    <div className="w-full h-screen overflow-hidden bg-zinc-950 relative">
      {/* 🔥 Компактный демо-индикатор */}
      {!user && (
        <div 
          className="absolute top-3 right-3 z-50 flex items-center gap-2 
                     bg-purple-600/80 backdrop-blur-sm 
                     border border-purple-400/30 
                     px-3 py-1.5 rounded-full 
                     shadow-lg shadow-purple-500/20
                     animate-pulse"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
          </span>
          <span className="text-white text-xs font-medium">
            🎮 ДЕМО
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/login')
            }}
            className="text-white/70 hover:text-white text-[10px] font-medium 
                       bg-white/10 hover:bg-white/20 
                       px-2 py-0.5 rounded-full transition-colors
                       border border-white/10"
          >
            Войти
          </button>
        </div>
      )}

      <GameUI userId={userId} />
    </div>
  )
}