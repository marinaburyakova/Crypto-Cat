// app/shop/page.tsx
'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'

interface UserData {
  id: string
  points: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  passiveRate: number
}

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
}

export default function ShopPage() {
  const [isTonModalOpen, setIsTonModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const activeUserId = 'guest_user_demo_1337'

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/clicks?userId=${activeUserId}`)
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
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [activeUserId])

  // Товары магазина
  const shopItems: ShopItem[] = [
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
    },
  ]

  const handleBuyClick = (item: ShopItem, method: 'ton' | 'stars') => {
    setSelectedItem(item)
    if (method === 'ton') {
      setIsTonModalOpen(true)
    }
  }

  const handlePurchaseSuccess = () => {
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> КИБЕР-МАГАЗИН
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
          <span>Улучшайте своего питомца</span>
          <span className="text-amber-400 font-bold">⭐</span>
          <span className="text-blue-400 font-bold">₿</span>
        </p>
        {userData && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-slate-400">💰 Баланс:</span>
            <span className="text-amber-400 font-bold">
              {userData.points.toLocaleString()} ⚡
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">🏆 {userData.level} LVL</span>
            <span className="text-slate-400">|</span>
            <span className="text-cyan-400">
              ⚡ {userData.energy}/{userData.maxEnergy}
            </span>
          </div>
        )}
      </header>

      {/* Список товаров */}
      <div className="relative z-10 flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none">
        {shopItems.map((item) => (
          <div
            key={item.id}
            className={`${item.bgColor} border ${item.borderColor} rounded-2xl p-4 shadow-lg transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <h3 className="font-bold text-sm text-slate-100">
                    {item.name}
                  </h3>
                  {item.popular && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5"
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
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5"
              />
            </div>
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
        />
      )}

      <div className="relative z-10 w-full">
        <BottomNav activeTab="shop" />
      </div>
    </div>
  )
}
