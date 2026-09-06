// components/game/GamePlayArea.tsx
'use client'

import { GameField } from './game-field'
import { useState, useEffect } from 'react'

interface GamePlayAreaProps {
  emotion: string
  energy: number
  onTap: (x: number, y: number) => void
  catModel: string
  catInfo: { name: string; emoji: string; text: string }
  isSuperhero: boolean
  isLegendary?: boolean
  comboCount: number
  points: number
}

export function GamePlayArea({
  emotion,
  energy,
  onTap,
  catModel,
  catInfo,
  isSuperhero,
  isLegendary = false,
  comboCount,
  points,
}: GamePlayAreaProps) {
  const [key, setKey] = useState(0)
  const [hasClicked, setHasClicked] = useState(false)

  useEffect(() => {
    setKey((prev) => prev + 1)
  }, [catModel])

  const handleTapWithHint = (x: number, y: number) => {
    if (!hasClicked) {
      setHasClicked(true)
    }
    onTap(x, y)
  }

  const shouldShowHint = !hasClicked && points < 10

  return (
    <div className="flex-1 relative overflow-hidden">
      <GameField
        key={key}
        emotion={emotion}
        energy={energy}
        onTap={handleTapWithHint}
        catModel={catModel}
        catInfo={catInfo}
        isSuperhero={isSuperhero}
        isLegendary={isLegendary}
      />

      {/* 🔥 Компактная полупрозрачная подсказка */}
      {shouldShowHint && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/5 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="animate-bounce-slow text-base">👆</span>
              <span className="text-white font-medium text-xs">
                Нажми на кота
              </span>
              <span className="text-white/30 text-[8px]">⭐</span>
            </div>
          </div>
        </div>
      )}

      {/* Комбо-счетчик */}
      {comboCount > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 rounded-full shadow-lg animate-bounce">
            <span className="text-white font-bold text-sm">
              🔥 x{comboCount} комбо!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
