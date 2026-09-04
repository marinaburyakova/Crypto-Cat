// app/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BottomNav } from '@/components/ui/bottom-nav'
import { GameField } from '@/components/game/game-field'
import { Trophy, Zap, ShoppingBag, X, AlertCircle } from 'lucide-react'
import { useTelegram } from '@/hooks/useTelegram'

// Конфигурация цен на энергию
const ENERGY_PRICES = {
  100: 0.99,
  500: 3.99,
  1000: 6.99,
  5000: 29.99,
} as const

type EnergyAmount = keyof typeof ENERGY_PRICES

// Конфигурация моделей котов
const CAT_MODELS = {
  default: '/assets/models/cat.glb',
  superhero: '/assets/models/cat_superhero.glb',
  legendary: '/assets/models/cat_legendary.glb',
} as const

// Получение модели кота
const getCatModel = (score: number): string => {
  if (score >= 1000) return CAT_MODELS.legendary
  if (score >= 50) return CAT_MODELS.superhero
  return CAT_MODELS.default
}

// Получение информации о коте
const getCatInfo = (score: number) => {
  if (score >= 1000) {
    return {
      name: 'Легендарный кот',
      emoji: '👑',
      text: 'Повелитель вселенной! 🌟',
    }
  }
  if (score >= 50) {
    return {
      name: 'Кот-супергерой',
      emoji: '🦸‍♂️',
      text: 'Спасает мир от скуки! ⚡',
    }
  }
  return { 
    name: 'Кибер-кот', 
    emoji: '🐱', 
    text: 'Твой верный друг!' 
  }
}

export default function HomePage() {
  // Используем хук Telegram
  const { 
    user, 
    isInTelegram, 
    isReady, 
    hapticFeedback, 
    notificationFeedback,
    showAlert, 
    showConfirm, 
    openLink 
  } = useTelegram()
  
  // Состояния игры
  const [score, setScore] = useState<number>(0)
  const [energy, setEnergy] = useState<number>(1000)
  const [maxEnergy, setMaxEnergy] = useState<number>(1000)
  const [level, setLevel] = useState<number>(1)
  const [exp, setExp] = useState<number>(0)
  const [emotion, setEmotion] = useState<string>('idle')
  const [chatText, setChatText] = useState<string>(
    'Привет! Я твой кибер-кот. Давай копить ядра! 🐾',
  )
  const [inputMessage, setInputMessage] = useState<string>('')
  const [isBuyingEnergy, setIsBuyingEnergy] = useState<boolean>(false)
  const [showEnergyModal, setShowEnergyModal] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)

  // Refs
  const clicksBuffer = useRef<number>(0)
  const prevScoreRef = useRef<number>(0)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Мемоизированный userId
  const activeUserId = useMemo(() => 
    user?.id?.toString() || 'guest_user_demo_1337', 
    [user]
  )

  // ============================================================
  // ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ
  // ============================================================
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const res = await fetch(`/api/clicks?userId=${activeUserId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      
      if (data.points !== undefined) {
        setScore(Number(data.points))
      }
      if (data.energy !== undefined) {
        setEnergy(Number(data.energy))
      }
      if (data.maxEnergy !== undefined) {
        setMaxEnergy(Number(data.maxEnergy))
      }
      
      // Обновляем уровень
      const calculatedLevel = Math.floor(Number(data.points || 0) / 500) + 1
      setLevel(calculatedLevel)
      setExp(Number(data.points || 0) % 500)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка'
      console.error('❌ Ошибка загрузки данных:', errorMsg)
      setError('Не удалось загрузить данные. Использую локальные значения.')
      
      // Используем дефолтные значения
      setScore(0)
      setEnergy(1000)
      setMaxEnergy(1000)
      setLevel(1)
      setExp(0)
    } finally {
      setIsLoading(false)
    }
  }, [activeUserId])

  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================
  useEffect(() => {
    if (isReady) {
      fetchUserData()
      
      // Приветственное сообщение
      if (isInTelegram && user) {
        setChatText(
          `Привет, ${user.first_name || 'друг'}! Я твой кибер-кот. Давай копить ядра! 🐾`
        )
      }
    }
  }, [isReady, isInTelegram, user, fetchUserData])

  // ============================================================
  // РАСЧЕТ УРОВНЯ И АКТИВАЦИЯ СУПЕРГЕРОЯ
  // ============================================================
  useEffect(() => {
    const calculatedLevel = Math.floor(score / 500) + 1
    const currentExp = score % 500
    setLevel(calculatedLevel)
    setExp(currentExp)

    // Активация супергероя
    if (score >= 50 && prevScoreRef.current < 50) {
      const cat = getCatInfo(score)
      setChatText(`🦸‍♂️ ${cat.emoji} ${cat.name}! ${cat.text}`)
      setEmotion('joy')

      showAlert('🦸‍♂️ Супер-кот активирован!\nТвой кот получил суперсилу!\nТеперь он защищает город!')
      notificationFeedback('success')
    }

    // Активация легендарного кота
    if (score >= 1000 && prevScoreRef.current < 1000) {
      const cat = getCatInfo(score)
      setChatText(`👑 ${cat.emoji} ${cat.name}! ${cat.text}`)
      setEmotion('joy')

      showAlert('👑 Легендарный кот!\nТы достиг высшего уровня!\nТвой кот - повелитель вселенной!')
      notificationFeedback('success')
    }

    prevScoreRef.current = score
  }, [score, showAlert, notificationFeedback])

  // ============================================================
  // ПАКЕТНАЯ ОТПРАВКА КЛИКОВ
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
          if (data.points !== undefined) {
            setScore(Number(data.points))
          }
          if (data.energy !== undefined) {
            setEnergy(Number(data.energy))
          }
        } else {
          // Возвращаем клики в буфер при ошибке
          clicksBuffer.current += clicksToSend
        }
      } catch (err) {
        console.error('❌ Сервер синхронизации недоступен:', err)
        clicksBuffer.current += clicksToSend
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      clicksBuffer.current = 0
    }
  }, [activeUserId])

  // ============================================================
  // ОБРАБОТКА ТАПА ПО КОТУ
  // ============================================================
  const handleTapAction = useCallback((x: number, y: number) => {
    // Ограничение частоты кликов (анти-спам)
    const now = Date.now()
    if (now - lastClickTime < 50) {
      return // Игнорируем слишком частые клики
    }
    setLastClickTime(now)

    if (energy <= 0) {
      showAlert('😿 Энергия закончилась! Купи энергию, чтобы продолжить тапать.')
      notificationFeedback('warning')
      return
    }

    // Обновляем состояния
    setScore((prev) => prev + 10)
    setEnergy((prev) => Math.max(0, prev - 1))
    clicksBuffer.current += 1
    setEmotion('joy')

    // Вибрация через Telegram Haptic Feedback
    hapticFeedback('medium')

    // Анимация клика (сброс через 300ms)
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }
    clickTimeoutRef.current = setTimeout(() => {
      setEmotion('idle')
    }, 300)

  }, [energy, lastClickTime, hapticFeedback, notificationFeedback, showAlert])

  // ============================================================
  // ПОКУПКА ЭНЕРГИИ
  // ============================================================
 
// app/page.tsx - исправленный фрагмент

// ============================================================
// ПОКУПКА ЭНЕРГИИ (ПОЛНОСТЬЮ ИСПРАВЛЕНО)
// ============================================================
const handleBuyEnergy = useCallback(async (amount: EnergyAmount) => {
  if (isBuyingEnergy) return
  
  setIsBuyingEnergy(true)
  
  try {
    const price = ENERGY_PRICES[amount]
    const newEnergy = energy + amount
    
    if (newEnergy > maxEnergy) {
      // ✅ ИСПРАВЛЕНО: безопасная проверка
      const shouldUpgradeResult = await showConfirm(
        `⚠️ У тебя максимум ${maxEnergy} энергии. Хочешь увеличить лимит до ${maxEnergy + amount} за $${price + 2}?`
      )
      
      // ✅ Проверяем только true
      if (shouldUpgradeResult === true) {
        // Увеличиваем максимум
        setMaxEnergy(prev => prev + amount)
        setEnergy(prev => Math.min(prev + amount, prev + amount))
        showAlert(`✅ Максимум энергии увеличен до ${maxEnergy + amount}!`)
        notificationFeedback('success')
        setShowEnergyModal(false)
      } else {
        showAlert('❌ Покупка отменена. Максимум энергии достигнут.')
        // Не закрываем модалку, чтобы пользователь мог выбрать другой пакет
      }
      return
    }
    
    // Обычная покупка (без превышения лимита)
    setEnergy(prev => Math.min(maxEnergy, prev + amount))
    showAlert(`✅ Куплено ${amount} энергии!`)
    notificationFeedback('success')
    setShowEnergyModal(false)
    
  } catch (err) {
    console.error('❌ Error buying energy:', err)
    showAlert('❌ Ошибка при покупке энергии. Попробуй позже.')
    notificationFeedback('error')
  } finally {
    setIsBuyingEnergy(false)
  }
}, [energy, maxEnergy, isBuyingEnergy, showAlert, showConfirm, notificationFeedback])
  // ============================================================
  // ОТПРАВКА СООБЩЕНИЯ В ЧАТ
  // ============================================================
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
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
        body: JSON.stringify({ 
          userId: activeUserId, 
          message: userMsg 
        }),
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
      hapticFeedback('light')
    } catch (err) {
      console.error('❌ Chat error:', err)
      setChatText('Мяу! Кажется, сеть упала... Проверь интернет. 😿')
      setEmotion('sad')
    }
  }, [inputMessage, activeUserId, hapticFeedback])

  // ============================================================
  // Очистка при размонтировании
  // ============================================================
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // ============================================================
  // ОТРИСОВКА ЗАГРУЗКИ
  // ============================================================
  if (!isReady || isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Загрузка...</p>
          {isInTelegram && user && (
            <p className="text-slate-500 text-xs mt-2">
              {user.first_name} {user.last_name}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // ОТРИСОВКА
  // ============================================================
  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between select-none">
      {/* СВЕТЯЩИЙСЯ ГРАДИЕНТНЫЙ ФОН */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[130px] animate-pulse [animation-duration:4s]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-600/15 blur-[100px] animate-pulse [animation-duration:6s]" />
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПОКУПКИ ЭНЕРГИИ */}
      {showEnergyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl shadow-yellow-500/20">
            <button
              onClick={() => setShowEnergyModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              disabled={isBuyingEnergy}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-2">🛒 Купить энергию</h3>
            <p className="text-sm text-slate-400 mb-4">
              Текущий баланс: <span className="text-cyan-400 font-bold">{energy} / {maxEnergy}</span>
            </p>
            
            <div className="space-y-2">
              {Object.entries(ENERGY_PRICES).map(([amount, price]) => {
                const numAmount = parseInt(amount)
                const isMaxed = energy + numAmount > maxEnergy
                return (
                  <button
                    key={amount}
                    onClick={() => handleBuyEnergy(numAmount as EnergyAmount)}
                    disabled={isBuyingEnergy || isMaxed}
                    className={`w-full text-white p-3 rounded-xl flex justify-between items-center transition-all ${
                      isMaxed 
                        ? 'bg-slate-800/50 opacity-50 cursor-not-allowed' 
                        : 'bg-slate-800 hover:bg-slate-700 active:scale-95'
                    }`}
                  >
                    <span>⚡ {amount} энергии</span>
                    <span className="text-yellow-400 font-bold">${price}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[10px] text-amber-400 text-center">
                💡 При покупке, если лимит превышен, ты сможешь увеличить максимум
              </p>
            </div>
          </div>
        </div>
      )}

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

        {/* Ошибка загрузки */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400 flex-1">{error}</p>
            <button
              onClick={fetchUserData}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Обновить
            </button>
          </div>
        )}

        {/* Информация о пользователе Telegram */}
        {isInTelegram && user && (
          <div className="flex items-center justify-end gap-2 px-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              {user.first_name?.[0] || '?'}
            </div>
            <span className="text-[10px] text-slate-400">
              {user.first_name} {user.last_name}
              {user.username && ` @${user.username}`}
            </span>
          </div>
        )}
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

        {/* ИНТЕРФЕЙС ЧАТА И ЭНЕРГИИ */}
        <div className="w-full p-4 space-y-3 bg-slate-950/40 backdrop-blur-sm rounded-t-3xl border-t border-slate-900/50">
          {/* Энергия с кнопкой покупки */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-mono">
              <Zap className={`w-3.5 h-3.5 ${energy > 0 ? 'fill-cyan-400 animate-pulse' : 'fill-red-400'}`} />
              <span className={energy > 0 ? 'text-cyan-400' : 'text-red-400'}>
                ЭНЕРГИЯ: {energy} / {maxEnergy}
              </span>
            </div>
            
            <Button
              onClick={() => setShowEnergyModal(true)}
              disabled={isBuyingEnergy}
              variant="default"
              size="default"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition-all duration-200 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {isBuyingEnergy ? 'Загрузка...' : 'Купить ⚡'}
            </Button>
          </div>

          {/* Чат */}
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

          {/* Форма чата */}
          <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Напиши котику..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-100 placeholder:text-slate-500"
            />
            <Button
              type="submit"
              variant="default"
              size="default"
              className="rounded-xl shadow-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold cursor-pointer transition-colors"
            >
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