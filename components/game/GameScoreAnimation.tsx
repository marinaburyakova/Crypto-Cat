// components/game/GameScoreAnimation.tsx
'use client'

import { useEffect, useState } from 'react'

interface GameScoreAnimationProps {
  points: number
  onAnimationChange: (isAnimating: boolean) => void
}

export function GameScoreAnimation({ points, onAnimationChange }: GameScoreAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (points > 0) {
      setIsAnimating(true)
      onAnimationChange(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onAnimationChange(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [points, onAnimationChange])

  return null
}