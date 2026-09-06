// components/game/GamePlayArea.tsx
'use client'

import { GameField } from './game-field'
import { GameCatNotification } from './GameCatNotification'
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
  points: number  // ✅ Добавлено
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
  points,  // ✅ Добавлено
}: GamePlayAreaProps) {
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey(prev => prev + 1)
  }, [catModel])

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 🔥 Красивые уведомления о достижениях */}
      <GameCatNotification
        points={points} // передавайте реальные points из GameUI
        isSuperhero={isSuperhero}
        isLegendary={isLegendary}
      />

      <GameField
        key={key}
        emotion={emotion}
        energy={energy}
        onTap={onTap}
        catModel={catModel}
        catInfo={catInfo}
        isSuperhero={isSuperhero}
        isLegendary={isLegendary}
      />

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