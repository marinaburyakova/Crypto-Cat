// components/game/GameHeader.tsx
'use client'

import { Trophy } from 'lucide-react'

interface GameHeaderProps {
  level: number
  points: number
  scoreAnimation: boolean
  catInfo: {
    color: string
    bgColor: string
    borderColor: string
    emoji: string
    name: string
  }
   isLegendary?: boolean 
}

export function GameHeader({ level, points, scoreAnimation, catInfo }: GameHeaderProps) {
  return (
    <header className="relative z-10 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${catInfo.bgColor} ${catInfo.borderColor}`}>
            <Trophy className={`w-4 h-4 ${catInfo.color}`} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Уровень</p>
            <p className="text-lg font-black text-white flex items-center gap-1">
              {level} <span className="text-sm text-purple-400">LVL</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Баланс</p>
          <p className={`text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent transition-all duration-300 ${scoreAnimation ? 'scale-110' : ''}`}>
            {points.toLocaleString()} ⚡
          </p>
        </div>
      </div>
    </header>
  )
}