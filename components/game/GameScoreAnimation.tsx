// components/game/GameScoreAnimation.tsx
'use client'

import { useEffect, useState, useRef } from 'react'

interface GameScoreAnimationProps {
  points: number
  onAnimationChange: (isAnimating: boolean) => void
}

export function GameScoreAnimation({ points, onAnimationChange }: GameScoreAnimationProps) {
  const [animations, setAnimations] = useState<{ id: string; x: number; y: number; value: number }[]>([])
  const prevPointsRef = useRef(points)
  const isAnimatingRef = useRef(false)

  // Эффект для отслеживания изменения points
  useEffect(() => {
    if (points === prevPointsRef.current) return

    const diff = points - prevPointsRef.current
    prevPointsRef.current = points

    if (diff > 0) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newAnimation = {
        id,
        x: Math.random() * 80 + 10,
        y: Math.random() * 40 + 30,
        value: diff,
      }

      setAnimations(prev => [...prev, newAnimation])
      
      // Устанавливаем флаг, что анимация активна
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true
        onAnimationChange(true)
      }

      // Удаляем анимацию через 1 секунду
      setTimeout(() => {
        setAnimations(prev => {
          const filtered = prev.filter(a => a.id !== id)
          // Если анимаций больше нет, сообщаем родителю
          if (filtered.length === 0 && isAnimatingRef.current) {
            isAnimatingRef.current = false
            // 🔥 ВАЖНО: вызываем onAnimationChange через setTimeout,
            // чтобы не обновлять родителя во время рендера
            setTimeout(() => onAnimationChange(false), 0)
          }
          return filtered
        })
      }, 1000)
    }
  }, [points, onAnimationChange])

  // Очищаем старые анимации, если их слишком много
  useEffect(() => {
    if (animations.length > 50) {
      setAnimations(prev => prev.slice(-30))
    }
  }, [animations.length])

  return (
    <>
      {animations.map(anim => (
        <div
          key={anim.id}
          className="fixed pointer-events-none text-2xl font-bold text-yellow-400 z-50"
          style={{
            left: `${anim.x}%`,
            top: `${anim.y}%`,
            animation: 'floatUp 1s ease-out forwards',
          }}
        >
          +{anim.value}
        </div>
      ))}
    </>
  )
}