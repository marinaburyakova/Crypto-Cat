// app/shop/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { BottomNav } from '@/components/ui/bottom-nav'
import { TonPaymentModal } from '@/components/game/TonPaymentModal'
import { StarsPaymentButton } from '@/components/game/StarsPaymentButton'
import {
  Zap,
  Shield,
  Sparkles,
  Crown,
  Star,
  Rocket,
  Gift,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// ✅ Расширенный интерфейс UserData
interface UserData {
  id: string
  points: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  passiveRate: number
  unclaimedPoints: number
  skin: string
  vipUntil: string | null
  totalSpent: number
}

// ✅ Расширенный интерфейс ShopItem
interface ShopItem {
  id: string
  name: string
  description: string
  priceTon: string
  priceStars: number
  icon: any
  color: string
  bgColor: string
  borderColor: string
  effect: string
  effectValue: any
  popular: boolean
  category?: 'energy' | 'level' | 'vip' | 'skin' | 'mega'
}

// ✅ Функция получения userId из Telegram
const getTelegramUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user
      if (tgUser?.id) {
        return tgUser.id.toString()
      }
    } catch (error) {
      console.warn('⚠️ Error getting Telegram user:', error)
    }
  }
  return null
}

export default function ShopPage() {
  const [isTonModalOpen, setIsTonModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // ✅ Получаем userId
  const activeUserId = useMemo(() => {
    const tgId = getTelegramUserId()
    return tgId || process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'guest_user_demo_1337'
  }, [])

  // ✅ Функция загрузки данных пользователя
  const fetchUserData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      // ✅ Используем правильный API эндпоинт
      const res = await fetch(`/api/user/profile?userId=${activeUserId}`)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.success) {
        setUserData({
          id: activeUserId,
          points: data.points || 0,
          energy: data.energy || 1000,
          maxEnergy: data.maxEnergy || 1000,
          level: data.level || 1,
          exp: data.exp || 0,
          passiveRate: data.passiveRate || 0,
          unclaimedPoints: data.unclaimedPoints || 0,
          skin: data.skin || 'default',
          vipUntil: data.vipUntil || null,
          totalSpent: data.totalSpent || 0,
        })
      } else {
        setError(data.error || 'Ошибка загрузки данных')
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      setError('Не удалось загрузить данные пользователя')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [activeUserId])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // ✅ Товары магазина с категориями
  const shopItems: ShopItem[] = useMemo(() => [
    {
      id: 'energy_boost',
      name: '⚡ Бустер энергии',
      description: '➕ Увеличивает максимальную энергию на 50',
      priceTon: '0.5',
      priceStars: 50,
      icon: Zap,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/20',
      effect: 'energy_boost',
      effectValue: 50,
      popular: true,
      category: 'energy',
    },
    {
      id: 'energy_boost_big',
      name: '⚡ Большой бустер энергии',
      description: '➕ Увеличивает максимальную энергию на 200',
      priceTon: '1.5',
      priceStars: 150,
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      effect: 'energy_boost_big',
      effectValue: 200,
      popular: false,
      category: 'energy',
    },
    {
      id: 'level_up',
      name: '📈 Мгновенный Level Up',
      description: '⬆️ Повышает уровень кота на 1 + бонус 50 очков',
      priceTon: '1.0',
      priceStars: 100,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
      effect: 'level_up',
      effectValue: 1,
      popular: false,
      category: 'level',
    },
    {
      id: 'level_up_big',
      name: '📈 Мега Level Up',
      description: '⬆️ Повышает уровень кота на 3 + бонус 200 очков',
      priceTon: '2.5',
      priceStars: 250,
      icon: TrendingUp,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      borderColor: 'border-indigo-400/20',
      effect: 'level_up_big',
      effectValue: 3,
      popular: false,
      category: 'level',
    },
    {
      id: 'vip_status',
      name: '👑 VIP Статус (7 дней)',
      description: '✨ +100% к пассивному доходу на 7 дней',
      priceTon: '5.0',
      priceStars: 500,
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      effect: 'vip_status',
      effectValue: 7,
      popular: true,
      category: 'vip',
    },
    {
      id: 'legendary_skin',
      name: '🔥 Легендарный скин',
      description: '🎨 Уникальный скин кота + 100 очков',
      priceTon: '10.0',
      priceStars: 1000,
      icon: Sparkles,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      effect: 'skin',
      effectValue: 'legendary',
      popular: false,
      category: 'skin',
    },
    {
      id: 'mega_pack',
      name: '🚀 Мега-пакет',
      description: '💎 Всё сразу: энергия + уровень + VIP + скин + 500 очков',
      priceTon: '25.0',
      priceStars: 2500,
      icon: Rocket,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10',
      borderColor: 'border-pink-400/20',
      effect: 'mega_pack',
      effectValue: 'all',
      popular: true,
      category: 'mega',
    },
  ], [])

  // ✅ Обработчик покупки
  const handleBuyClick = (item: ShopItem, method: 'ton' | 'stars') => {
    setSelectedItem(item)
    setPurchaseStatus({ type: null, message: '' })
    
    if (method === 'ton') {
      setIsTonModalOpen(true)
    }
    // Для Stars используется компонент StarsPaymentButton
  }

  // ✅ Обработчик успешной покупки
  const handlePurchaseSuccess = useCallback(() => {
    setPurchaseStatus({
      type: 'success',
      message: '✅ Покупка успешно завершена!',
    })
    // Обновляем данные без перезагрузки страницы
    fetchUserData()
    
    // Закрываем модалку
    setIsTonModalOpen(false)
    setSelectedItem(null)
    
    // Автоматически скрываем сообщение через 3 секунды
    setTimeout(() => {
      setPurchaseStatus({ type: null, message: '' })
    }, 3000)
  }, [fetchUserData])

  // ✅ Обработчик ошибки покупки
  const handlePurchaseError = useCallback((error: string) => {
    setPurchaseStatus({
      type: 'error',
      message: `❌ Ошибка: ${error}`,
    })
    
    setTimeout(() => {
      setPurchaseStatus({ type: null, message: '' })
    }, 5000)
  }, [])

  // ✅ Проверка, может ли пользователь купить товар
  const canAffordStars = useCallback((priceStars: number) => {
    // Для проверки используем points или отдельный баланс звезд
    // Здесь нужно определить, как хранятся звезды
    return true // Временно всегда true
  }, [])

  // ✅ Группировка товаров по категориям
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShopItem[]> = {}
    shopItems.forEach(item => {
      const category = item.category || 'other'
      if (!groups[category]) groups[category] = []
      groups[category].push(item)
    })
    return groups
  }, [shopItems])

  // Компонент статуса покупки
  const renderPurchaseStatus = () => {
    if (!purchaseStatus.type) return null
    
    const isSuccess = purchaseStatus.type === 'success'
    return (
      <div className={`p-3 rounded-xl text-sm font-medium ${
        isSuccess 
          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
          : 'bg-red-500/20 border border-red-500/30 text-red-400'
      }`}>
        {purchaseStatus.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Загрузка магазина...</p>
          </div>
        </div>
        <BottomNav activeTab="shop" />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
      {/* Градиентный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-amber-600/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-orange-600/20 blur-[130px] animate-pulse [animation-duration:4s]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-yellow-600/15 blur-[100px] animate-pulse [animation-duration:6s]" />
      </div>

      <header className="relative z-10 p-4 bg-slate-900/70 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> КИБЕР-МАГАЗИН
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Улучшайте своего питомца</span>
              <span className="text-amber-400 font-bold">⭐</span>
              <span className="text-blue-400 font-bold">₿</span>
            </p>
          </div>
          
          {/* Кнопка обновления */}
          <button
            onClick={fetchUserData}
            disabled={isRefreshing}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <Loader2 className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {userData && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">💰 Баланс:</span>
            <span className="text-amber-400 font-bold">
              {userData.points.toLocaleString()} ⚡
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">🏆 {userData.level} LVL</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">
              ⚡ {userData.energy}/{userData.maxEnergy}
            </span>
            {userData.vipUntil && new Date(userData.vipUntil) > new Date() && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Список товаров */}
      <div className="relative z-10 flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button 
              onClick={fetchUserData}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Повторить
            </button>
          </div>
        )}

        {renderPurchaseStatus()}

        {/* Товары по категориям */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-3">
            {category !== 'other' && (
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                {category === 'energy' && '⚡ Энергия'}
                {category === 'level' && '📈 Уровень'}
                {category === 'vip' && '👑 VIP'}
                {category === 'skin' && '🎨 Скины'}
                {category === 'mega' && '🚀 Мега-пакеты'}
              </h2>
            )}
            
            {items.map((item) => (
              <div
                key={item.id}
                className={`${item.bgColor} border ${item.borderColor} rounded-2xl p-4 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">
                        {item.name}
                      </h3>
                      {item.popular && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          🔥 ХИТ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {/* Кнопка покупки за TON */}
                  <button
                    onClick={() => handleBuyClick(item, 'ton')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRefreshing}
                  >
                    <span>₿</span> {item.priceTon} TON
                  </button>

                  {/* Кнопка покупки за Stars */}
                  <StarsPaymentButton
                    userId={activeUserId}
                    itemPriceStars={item.priceStars}
                    itemSku={item.id}
                    itemName={item.name}
                    onSuccess={handlePurchaseSuccess}
                    onError={handlePurchaseError}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRefreshing || !canAffordStars(item.priceStars)}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Баннер статистики */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-center gap-2">
            <Gift className="w-4 h-4" /> Специальное предложение
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Покупайте за TON и получайте{' '}
            <span className="text-amber-400 font-bold">+20%</span> бонусных
            очков!
          </p>
          {userData && userData.totalSpent > 0 && (
            <p className="text-[10px] text-slate-500 mt-2">
              Всего потрачено: ${userData.totalSpent.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Модалка оплаты TON */}
      {selectedItem && (
        <TonPaymentModal
          userId={activeUserId}
          isOpen={isTonModalOpen}
          onClose={() => {
            setIsTonModalOpen(false)
            setSelectedItem(null)
          }}
          itemPriceTon={selectedItem.priceTon}
          itemSku={selectedItem.id}
          itemName={selectedItem.name}
          onSuccess={handlePurchaseSuccess}
          onError={handlePurchaseError}
        />
      )}

      <div className="relative z-10 w-full">
        <BottomNav activeTab="shop" />
      </div>
    </div>
  )
}