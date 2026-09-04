// components/game/GameAchievementNotifier.tsx
'use client'

import { useEffect } from 'react'

interface GameAchievementNotifierProps {
  points: number
  isLegendary: boolean
  showNotification: (type: any, message: string) => void
  notificationFeedback: (type?: any) => void
  hapticFeedback: (style?: any) => void
}

export function GameAchievementNotifier({
  points,
  isLegendary,
  showNotification,
  notificationFeedback,
  hapticFeedback,
}: GameAchievementNotifierProps) {
  
  // Уведомление о супергерое
  useEffect(() => {
    if (points >= 50 && points < 55) {
      showNotification('achievement', '🦸‍♂️ Супер-кот активирован! Твой кот получил суперсилу!')
      notificationFeedback('success')
      hapticFeedback('heavy')
    }
  }, [points, showNotification, notificationFeedback, hapticFeedback])

  // Уведомление о легендарном коте
  useEffect(() => {
    if (points >= 1000 && points < 1005) {
      showNotification('achievement', '👑 Легендарный кот активирован! Ты достиг высшего уровня!')
      notificationFeedback('success')
      hapticFeedback('heavy')
    }
  }, [points, showNotification, notificationFeedback, hapticFeedback])

  return null
}