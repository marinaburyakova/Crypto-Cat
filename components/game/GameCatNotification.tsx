// components/game/GameCatNotification.tsx
'use client'

import { useState, useEffect } from 'react'
import { Crown, Sparkles, Rocket } from 'lucide-react'

interface GameCatNotificationProps {
  points: number
  isSuperhero: boolean
  isLegendary: boolean
  onNotification?: (type: string, message: string) => void
}

export function GameCatNotification({ 
  points, 
  isSuperhero, 
  isLegendary, 
  onNotification 
}: GameCatNotificationProps) {
  const [showSuperhero, setShowSuperhero] = useState(false)
  const [showLegendary, setShowLegendary] = useState(false)
  const [prevPoints, setPrevPoints] = useState(points)

  useEffect(() => {
    // Проверяем достижение супергероя
    if (isSuperhero && prevPoints < 100 && !showSuperhero) {
      setShowSuperhero(true)
      onNotification?.('achievement', '🦸‍♂️ Супер-кот активирован!')
      
      setTimeout(() => {
        setShowSuperhero(false)
      }, 3000)
    }

    // Проверяем достижение легендарного
    if (isLegendary && prevPoints < 500 && !showLegendary) {
      setShowLegendary(true)
      onNotification?.('achievement', '👑 Легендарный кот!')
      
      setTimeout(() => {
        setShowLegendary(false)
      }, 4000)
    }

    setPrevPoints(points)
  }, [points, isSuperhero, isLegendary, prevPoints, onNotification])

  return (
    <>
      {/* Уведомление о супергерое */}
      {showSuperhero && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-float-down">
          <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-xl 
                          border border-amber-400/50 rounded-2xl px-6 py-3 
                          shadow-2xl shadow-amber-500/30">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6 text-white animate-bounce" />
              <div>
                <p className="text-white font-bold text-sm">🦸‍♂️ Супер-кот активирован!</p>
                <p className="text-white/70 text-xs">Теперь ты супергерой!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление о легендарном коте */}
      {showLegendary && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-float-down">
          <div className="bg-gradient-to-r from-yellow-400/90 to-amber-500/90 backdrop-blur-xl 
                          border border-yellow-300/50 rounded-2xl px-6 py-3 
                          shadow-2xl shadow-yellow-500/40">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-800 animate-pulse" />
              <div>
                <p className="text-yellow-900 font-bold text-sm">👑 Легендарный кот!</p>
                <p className="text-yellow-800/80 text-xs">Повелитель вселенной!</p>
              </div>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}