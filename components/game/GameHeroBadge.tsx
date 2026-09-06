// components/game/GameHeroBadge.tsx
'use client'

import { Crown, Sparkles } from 'lucide-react'

interface GameHeroBadgeProps {
  isSuperhero: boolean
  isLegendary?: boolean
  catInfo: {
    emoji: string
    name: string
  }
}

export function GameHeroBadge({
  isSuperhero,
  isLegendary,
  catInfo,
}: GameHeroBadgeProps) {
  if (!isSuperhero) return null

  return (
    <div
      className={`absolute top-4 left-4 z-10 rounded-xl px-3 py-1.5 backdrop-blur-sm transition-all duration-500 ${
        isLegendary
          ? 'bg-yellow-500/20 border border-yellow-400/50 shadow-lg shadow-yellow-500/20 animate-pulse'
          : 'bg-amber-500/20 border border-amber-500/30'
      }`}
    >
      <p
        className={`text-xs font-bold flex items-center gap-1.5 ${
          isLegendary ? 'text-yellow-400' : 'text-amber-400'
        }`}
      >
        {isLegendary ? (
          <>
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-300/80">👑</span>
            {catInfo.emoji} {catInfo.name}
            <Sparkles className="w-3 h-3 text-yellow-300" />
          </>
        ) : (
          <>
            <Crown className="w-3 h-3" />
            {catInfo.emoji} {catInfo.name}
          </>
        )}
      </p>
    </div>
  )
}
