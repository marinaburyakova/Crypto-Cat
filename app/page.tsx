// app/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { init, retrieveLaunchParams } from '@telegram-apps/sdk-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BottomNav } from '@/components/ui/bottom-nav'
import { GameField } from '@/components/game/game-field'
import { Trophy, Zap } from 'lucide-react'

// ============================================================
// ВЫБОР МОДЕЛИ КОТА В ЗАВИСИМОСТИ ОТ ОЧКОВ
// ============================================================
const getCatModel = (score: number): string => {
  if (score >= 50) {
    return '/assets/models/cat_superhero.glb'
  }
  return '/assets/models/cat.glb'
}

const getCatInfo = (score: number) => {
  if (score >= 50) {
    return {
      name: 'Кот-супергерой',
      emoji: '🦸‍♂️',
      text: 'Спасает мир от скуки! ⚡',
    }
  }
  return { name: 'Кибер-кот', emoji: '🐱', text: 'Твой верный друг!' }
}

export default function HomePage() {
  const [score, setScore] = useState<number>(0)
  const [energy, setEnergy] = useState<number>(1000)
  const [level, setLevel] = useState<number>(1)
  const [exp, setExp] = useState<number>(0)
  const [emotion, setEmotion] = useState<string>('idle')
  const [chatText, setChatText] = useState<string>(
    'Привет! Я твой кибер-кот. Давай копить ядра! 🐾',
  )
  const [inputMessage, setInputMessage] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const clicksBuffer = useRef<number>(0)
  const prevScoreRef = useRef<number>(0)
  const activeUserId = 'guest_user_demo_1337'

  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ TELEGRAM SDK
  // ============================================================
  useEffect(() => {
    const initTelegram = async () => {
      try {
        // Проверяем, что мы в Telegram
        if (typeof window !== 'undefined') {
          // Проверяем наличие Telegram WebApp
          const isTelegram = !!(
            window.Telegram?.WebApp?.initData ||
            window.location.search.includes('tgWebAppData')
          )

          if (isTelegram) {
            console.log('Initializing Telegram SDK...')
            await init()
            const lp = retrieveLaunchParams()
            console.log('Telegram initialized:', lp)

            // Отмечаем, что WebApp готов
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.ready()
              window.Telegram.WebApp.expand()
            }

            setIsInitialized(true)
          } else {
            console.log('Not in Telegram environment, using demo mode')
            setIsInitialized(false)
          }
        }
      } catch (err) {
        console.error('Ошибка инициализации Telegram SDK:', err)
        setIsInitialized(false)
      }
    }

    initTelegram()

    // Первичный запрос для загрузки текущего баланса игрока из Postgres
    async function fetchInitialPoints() {
      try {
        const res = await fetch('/api/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeUserId, clicks: 0 }),
        })
        const data = await res.json()
        if (data.points) {
          setScore(Number(data.points))
        }
      } catch (err) {
        console.error('Ошибка загрузки стартового баланса:', err)
      }
    }

    fetchInitialPoints()
  }, [])

  // ============================================================
  // РАСЧЕТ УРОВНЯ И АКТИВАЦИЯ СУПЕРГЕРОЯ
  // ============================================================
  useEffect(() => {
    const calculatedLevel = Math.floor(score / 500) + 1
    const currentExp = score % 500
    setLevel(calculatedLevel)
    setExp(currentExp)

    if (score >= 50 && prevScoreRef.current < 50) {
      const cat = getCatInfo(score)
      setChatText(`🦸‍♂️ ${cat.emoji} ${cat.name}! ${cat.text}`)
      setEmotion('joy')

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          title: '🦸‍♂️ Супер-кот активирован!',
          message: 'Твой кот получил суперсилу!\nТеперь он защищает город!',
          buttons: [{ type: 'ok' }],
        })
      }
    }

    prevScoreRef.current = score
  }, [score])

  // ============================================================
  // ПАКЕТНАЯ ОТПРАВКА КЛИКОВ В REDIS РАЗ В 3 СЕКУНДЫ
  // ============================================================
  useEffect(() => {
    const interval = setInterval(async () => {
      const clicksToSend = clicksBuffer.current
      if (clicksToSend === 0) return

      clicksBuffer.current = 0

      try {
        const response = await fetch('/api/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeUserId,
            clicks: clicksToSend,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.points) {
            setScore(Number(data.points) + clicksBuffer.current * 10)
          }
        } else {
          clicksBuffer.current += clicksToSend
        }
      } catch (err) {
        console.error('Сервер синхронизации недоступен, сохраняем клики', err)
        clicksBuffer.current += clicksToSend
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // ============================================================
  // ОБРАБОТКА ТАПА ПО КОТУ
  // ============================================================
  const handleTapAction = (x: number, y: number) => {
    if (energy <= 0) return

    setScore((prev) => prev + 10)
    setEnergy((prev) => Math.max(0, prev - 1))

    clicksBuffer.current += 1
    setEmotion('joy')

    if (
      typeof window !== 'undefined' &&
      window.Telegram?.WebApp?.HapticFeedback
    ) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
    }
  }

  // ============================================================
  // ОТПРАВКА СООБЩЕНИЯ В ЧАТ ИИ
  // ============================================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMsg = inputMessage
    setInputMessage('')
    setChatText('Думаю...')
    setEmotion('idle')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, message: userMsg }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setChatText(data.response || 'Мяу! Не понял тебя...')
      setEmotion('joy')
    } catch (err) {
      console.error('Chat error:', err)
      setChatText('Мяу! Кажется, сеть упала... Проверь интернет. 😿')
      setEmotion('sad')
    }
  }

return (
  <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between select-none">
    {/* СВЕТЯЩИЙСЯ ГРАДИЕНТНЫЙ ФОН */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Верхний левый синий свет */}
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
      
      {/* Правый фиолетовый свет в центре */}
      <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[130px] animate-pulse [animation-duration:4s]" />
      
      {/* Нижний изумрудный/бирюзовый акцент */}
      <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-600/15 blur-[100px] animate-pulse [animation-duration:6s]" />
    </div>

    {/* ШАПКА ИГРЫ */}
    <header className="w-full bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 p-4 z-10 space-y-3">
      <div className="flex justify-between items-center w-full px-1">
        <div className="flex items-center space-x-2">
          <div className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Уровень
            </p>
            <p className="text-sm font-black text-slate-200">{level} LVL</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Баланс Энергоядер
          </p>
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono tracking-tight">
            {score.toLocaleString()} ⚡
          </p>
        </div>
      </div>

      <div className="w-full space-y-1 px-1">
        <div className="flex justify-between text-[9px] font-mono text-slate-400 px-1">
          <span>ОПЫТ ДО СЛЕД. УРОВНЯ</span>
          <span>{exp} / 500 XP</span>
        </div>
        <Progress
          value={(exp / 500) * 100}
          className="h-1.5 w-full bg-slate-800"
        />
      </div>
    </header>

    {/* 3D ИГРОВОЕ ПОЛЕ И ИНТЕРФЕЙС */}
    <div className="flex-1 relative w-full overflow-hidden flex flex-col z-10">
      <div className="flex-1 w-full relative">
        <GameField
          emotion={emotion}
          energy={energy}
          onTap={handleTapAction}
          catModel={getCatModel(score)}
          catInfo={getCatInfo(score)}
          isSuperhero={score >= 50}
        />
      </div>

      {/* ИНТЕРФЕЙС ЧАТА */}
      <div className="w-full p-4 space-y-3 bg-slate-950/40 backdrop-blur-sm rounded-t-3xl border-t border-slate-900/50">
        <div className="w-full flex items-center space-x-1.5 text-xs text-cyan-400 font-mono mb-1 px-1">
          <Zap className="w-3.5 h-3.5 fill-cyan-400 animate-pulse" />
          <span>ЭНЕРГИЯ ТАПОВ: {energy} / 1000</span>
        </div>

        <div
          className="bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 min-h-12 shadow-xl"
          role="log"
          aria-live="polite"
        >
          <p className="text-xs font-semibold text-purple-400 mb-0.5">
            🐾 {getCatInfo(score).emoji} {getCatInfo(score).name}:
          </p>
          <p className="text-sm font-medium text-slate-100">{chatText}</p>
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex gap-2 w-full"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Напиши котику..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-100 placeholder:text-slate-500"
          />
          <Button
            type="submit"
            className="rounded-xl shadow-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold cursor-pointer transition-colors" variant={''} size={''}          >
            Отправить
          </Button>
        </form>
      </div>
    </div>

    {/* НИЖНЯЯ НАВИГАЦИЯ */}
    <div className="w-full z-20">
      <BottomNav activeTab="game" />
    </div>
  </div>
)

}
