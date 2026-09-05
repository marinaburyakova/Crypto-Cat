// hooks/useGameLogic.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { HapticStyle, NotificationType } from './useTelegram'

interface UseGameLogicProps {
  userId: string
  onNotification?: (type: NotificationType, message: string) => void
  onHaptic?: (style: HapticStyle) => void
  onNotificationFeedback?: (type: NotificationType) => void
}

export function useGameLogic({
  userId,
  onNotification,
  onHaptic,
  onNotificationFeedback,
}: UseGameLogicProps) {
  const [points, setPoints] = useState<number>(0)
  const [energy, setEnergy] = useState<number>(1000)
  const [maxEnergy, setMaxEnergy] = useState<number>(1000)
  const [level, setLevel] = useState<number>(1)
  const [exp, setExp] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [comboCount, setComboCount] = useState<number>(0)

  const clicksBuffer = useRef<number>(0)
  const prevScoreRef = useRef<number>(0)
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef<boolean>(true)

  const isDemo = userId === 'demo'

  // ✅ Загрузка данных
  const fetchUserData = useCallback(async () => {
    console.log('🔄 fetchUserData called for userId:', userId)

    // 🔥 Если демо-режим — не ходим на сервер
    if (isDemo) {
      setPoints(0)
      setEnergy(1000)
      setMaxEnergy(1000)
      setLevel(1)
      setExp(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch(`/api/clicks?userId=${userId}`)
      console.log('📡 API response status:', res.status)

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const data = await res.json()
      console.log('📦 API data:', data)

      if (data.points !== undefined) setPoints(Number(data.points))
      if (data.energy !== undefined) setEnergy(Number(data.energy))
      if (data.maxEnergy !== undefined) setMaxEnergy(Number(data.maxEnergy))

      const calculatedLevel = Math.floor(Number(data.points || 0) / 500) + 1
      setLevel(calculatedLevel)
      setExp(Number(data.points || 0) % 500)

      console.log('✅ Data loaded successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка'
      console.error('❌ Ошибка загрузки данных:', errorMsg)
      setError('Не удалось загрузить данные. Использую локальные значения.')
      setPoints(0)
      setEnergy(1000)
      setMaxEnergy(1000)
      setLevel(1)
      setExp(0)
    } finally {
      setIsLoading(false)
      console.log('✅ isLoading set to false')
    }
  }, [userId, isDemo])

  // ✅ ВАЖНО: Вызываем fetchUserData при монтировании
  useEffect(() => {
    console.log('🔄 useGameLogic mounted, calling fetchUserData')
    fetchUserData()
  }, [fetchUserData])

  // Отправка кликов
  useEffect(() => {
    // 🔥 В демо-режиме не отправляем клики на сервер
    if (isDemo) {
      console.log('ℹ️ Демо-режим: клики не отправляются на сервер')
      return
    }

    const interval = setInterval(async () => {
      if (clicksBuffer.current === 0) return

      const sendClicks = clicksBuffer.current
      clicksBuffer.current = 0

      try {
        const res = await fetch('/api/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, clicks: sendClicks }),
        })
        const data = await res.json()

        if (data.points && isMounted.current) {
          setPoints(Number(data.points))
        }
        if (data.energy !== undefined && isMounted.current) {
          setEnergy(Number(data.energy))
        }
      } catch (err) {
        console.error('❌ Ошибка отправки кликов:', err)
        clicksBuffer.current += sendClicks
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [userId, isDemo])

  // Обработка клика
  const handleTap = useCallback(
    (x: number, y: number) => {
      const now = Date.now()
      if (now - lastClickTime < 50) return
      setLastClickTime(now)

      if (energy <= 0) {
        onNotification?.('warning', '😿 Энергия закончилась! Купи энергию в магазине')
        onNotificationFeedback?.('warning')
        return
      }

      const newPoints = points + 10
      setPoints(newPoints)
      setEnergy((prev) => Math.max(0, prev - 1))

      // В демо-режиме не отправляем клики на сервер
      if (!isDemo) {
        clicksBuffer.current += 1
      }

      setComboCount((prev) => {
        const newCombo = prev + 1
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current)
        comboTimeoutRef.current = setTimeout(() => setComboCount(0), 2000)
        return newCombo
      })

      onHaptic?.('medium')
    },
    [energy, lastClickTime, points, onNotification, onNotificationFeedback, onHaptic, isDemo]
  )

  // Обновление уровня
  useEffect(() => {
    const calculatedLevel = Math.floor(points / 500) + 1
    setLevel(calculatedLevel)
    setExp(points % 500)

    if (points >= 50 && prevScoreRef.current < 50) {
      onNotification?.('achievement', '🦸‍♂️ Супер-кот активирован!')
      onNotificationFeedback?.('success')
      onHaptic?.('heavy')
    }
    if (points >= 1000 && prevScoreRef.current < 1000) {
      onNotification?.('achievement', '👑 Легендарный кот!')
      onNotificationFeedback?.('success')
      onHaptic?.('heavy')
    }

    prevScoreRef.current = points
  }, [points, onNotification, onNotificationFeedback, onHaptic])

  // Очистка
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current)
    }
  }, [])

  return {
    points,
    energy,
    maxEnergy,
    level,
    exp,
    isLoading,
    error,
    comboCount,
    handleTap,
    fetchUserData,
    setEnergy,
    setPoints,
    setMaxEnergy,
  }
}