// components/game/GameHeroBadge.tsx
'use client'

import { Crown } from 'lucide-react'

interface GameHeroBadgeProps {
  isSuperhero: boolean
  isLegendary?: boolean
  catInfo: {
    emoji: string
    name: string
  }
}

export function GameHeroBadge({ isSuperhero, catInfo }: GameHeroBadgeProps) {
  if (!isSuperhero) return null

  return (
    <div className="absolute top-4 left-4 z-10 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-1.5 backdrop-blur-sm animate-pulse">
      <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
        <Crown className="w-3 h-3" />
        {catInfo.emoji} {catInfo.name}
      </p>
    </div>
  )
}
