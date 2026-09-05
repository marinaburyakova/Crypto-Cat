// components/ui/DemoBanner.tsx
'use client'

import { useRouter } from 'next/navigation'

interface DemoBannerProps {
  onSave?: () => void
}

export function DemoBanner({ onSave }: DemoBannerProps) {
  const router = useRouter()

  return (
    <div className="bg-gradient-to-r from-purple-600/95 to-pink-600/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between shadow-lg shadow-purple-500/20">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-white text-sm font-medium">🎮 Демо-режим</span>
        <span className="text-white/60 text-xs hidden sm:inline">
          Прогресс не сохраняется
        </span>
      </div>
      <button
        onClick={() => router.push('/login')}
        className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
      >
        🔐 Войти
      </button>
    </div>
  )
}