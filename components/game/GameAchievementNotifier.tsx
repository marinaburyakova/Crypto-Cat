// components/game/GameAchievementNotifier.tsx
'use client'

import { useEffect, useRef } from 'react'

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
  
  // Используем ref для отслеживания уже показанных уведомлений
  const notifiedAchievements = useRef<Set<string>>(new Set())

  // Обработка всех достижений в одном useEffect
  useEffect(() => {
    // Супер-кот (50-54 очка)
    if (points >= 50 && points < 55 && !notifiedAchievements.current.has('superhero')) {
      showNotification('achievement', '🦸‍♂️ Супер-кот активирован! Твой кот получил суперсилу!')
      notificationFeedback('success')
      hapticFeedback('heavy')
      notifiedAchievements.current.add('superhero')
    }

    // Легендарный кот (1000-1004 очка)
    if (points >= 1000 && points < 1005 && !notifiedAchievements.current.has('legendary')) {
      showNotification('achievement', '👑 Легендарный кот активирован! Ты достиг высшего уровня!')
      notificationFeedback('success')
      hapticFeedback('heavy')
      notifiedAchievements.current.add('legendary')
    }
  }, [points, showNotification, notificationFeedback, hapticFeedback])

  return null
}