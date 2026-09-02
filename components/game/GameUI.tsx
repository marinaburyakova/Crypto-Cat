// components/game/GameUI.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { CanvasContainer } from './CanvasContainer'
import { TonPaymentModal } from './TonPaymentModal'
import { StarsPaymentButton } from './StarsPaymentButton'
import { Coins, Zap } from 'lucide-react'

interface Particle {
  id: number
  x: number
  y: number
}

export function GameUI({ userId }: { userId: string }) {
  const [points, setPoints] = useState<number>(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const [isTonModalOpen, setIsTonModalOpen] = useState<boolean>(false)

  const clickBuffer = useRef<number>(0)
  const isMounted = useRef<boolean>(true)

  // 1. Загружаем актуальный баланс пользователя при старте приложения
  useEffect(() => {
    isMounted.current = true

    async function fetchInitialPoints() {
      try {
        // Запрашиваем состояние из Redis/Postgres (можно использовать тот же роут с clicks: 0)
        const res = await fetch('/api/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, clicks: 0 }),
        })
        const data = await res.json()
        if (data.points && isMounted.current) {
          setPoints(Number(data.points))
        }
      } catch (err) {
        console.error('Ошибка загрузки стартового баланса:', err)
      }
    }

    fetchInitialPoints()

    return () => {
      isMounted.current = false
    }
  }, [userId])

  // 2. Каждые 3 секунды отправляем накопленный буфер кликов на бэкенд
  useEffect(() => {
    const interval = setInterval(async () => {
      if (clickBuffer.current === 0) return

      const sendClicks = clickBuffer.current
      clickBuffer.current = 0 // Сразу очищаем буфер для фиксации новых кликов

      try {
        const res = await fetch('/api/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, clicks: sendClicks }),
        })
        const data = await res.json()

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Вместо слепой перезаписи стейта,
        // мы берем точный баланс с сервера и добавляем к нему только то,
        // что пользователь успел накликать ВО ВРЕМЯ выполнения сетевого запроса.
        if (data.points && isMounted.current) {
          setPoints(Number(data.points) + clickBuffer.current * 10)
        }
      } catch (err) {
        console.error('Ошибка отправки батча кликов:', err)
        // В случае ошибки возвращаем неотправленные клики обратно в буфер
        clickBuffer.current += sendClicks
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [userId])

  const handleCatClick = (screenX: number, screenY: number) => {
    // Мгновенно обновляем UI (Client-side prediction) — 1 клик = 10 поинтов
    setPoints((prev) => prev + 10)
    clickBuffer.current += 1

    // Спавним вылетающую цифру "+10"
    const newParticle: Particle = {
      id: Date.now() + Math.random(),
      x: screenX,
      y: screenY,
    }
    setParticles((prev) => [...prev, newParticle])

    // Безопасное удаление партикла с проверкой монтирования
    setTimeout(() => {
      if (isMounted.current) {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
      }
    }, 700)
  }

  return (
    <div className="flex flex-col items-center justify-between h-full max-w-md mx-auto p-4 space-y-6 select-none">
      {/* Счётчик баланса */}
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
          Ваш Баланс
        </p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="text-amber-400 w-8 h-8 animate-pulse" />
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {points.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3D Окно рендеринга кота */}
      <CanvasContainer onVisualClick={handleCatClick} />

      {/* Вылетающие цифры поверх всего экрана по анимации Tailwind v4 */}
      {particles.map((p) => (
        <span
          key={p.id}
          style={{ top: p.y - 20, left: p.x - 15 }}
          className="fixed pointer-events-none text-3xl font-black text-amber-400 select-none animate-click-pop z-50 text-stroke drop-shadow-md"
        >
          +10
        </span>
      ))}

      {/* Сетка игровых кнопок (Донат и Прокачка) */}
      <div className="grid grid-cols-1 gap-3 w-full">
        <button
          onClick={() => setIsTonModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
        >
          <Zap size={18} /> Купить Буст пассива (0.5 TON)
        </button>

        <StarsPaymentButton
          userId={userId}
          itemPriceStars={50}
          itemSku="cat_level_up"
          itemName="Повысить Уровень Кота"
        />
      </div>

      {/* Модальное окно оплаты TON */}
      <TonPaymentModal
        userId={userId}
        isOpen={isTonModalOpen}
        onClose={() => setIsTonModalOpen(false)}
        itemPriceTon="0.5"
        itemSku="boost_x2"
        itemName="Бустер пассивного дохода x2"
      />
    </div>
  )
}
