// components/game/GameCombo.tsx
'use client'

import { TrendingUp } from 'lucide-react'

interface GameComboProps {
  count: number
  minCount?: number
}

export function GameCombo({ count, minCount = 5 }: GameComboProps) {
  if (count < minCount) return null

  return (
    <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5 backdrop-blur-sm animate-pulse">
      <p className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3" />
        x{count} комбо!
      </p>
    </div>
  )
}