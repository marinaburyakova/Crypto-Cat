// components/game/EnergyModal.tsx
'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STARS_PRICES = {
  100: 50,
  500: 200,
  1000: 350,
  5000: 1500,
} as const

const TON_PRICES = {
  100: 0.5,
  500: 2.0,
  1000: 3.5,
  5000: 15.0,
} as const

type EnergyAmount = keyof typeof STARS_PRICES

interface EnergyModalProps {
  isOpen: boolean
  onClose: () => void
  currentEnergy: number
  maxEnergy: number
  userStars: number
  userId: string
  onBuyStars: (amount: EnergyAmount) => Promise<void>
  onBuyTon: (amount: EnergyAmount) => Promise<void>
  isBuying: boolean
  isRegistered: boolean  // 🔥 Добавлено
}

export function EnergyModal({ 
  isOpen, 
  onClose, 
  currentEnergy, 
  maxEnergy,
  userStars,
  userId,
  onBuyStars,
  onBuyTon,
  isBuying,
  isRegistered,
}: EnergyModalProps) {
  const [activeTab, setActiveTab] = useState<'stars' | 'ton'>('stars')
  const [loadingAmount, setLoadingAmount] = useState<EnergyAmount | null>(null)
  const router = useRouter()

  if (!isOpen) return null

  const isEnergyFull = currentEnergy >= maxEnergy
  const canAffordStars = (price: number) => userStars >= price
  const formatTonPrice = (price: number) => price.toFixed(1)

  const handleBuy = async (amount: EnergyAmount) => {
    // 🔥 Проверка на регистрацию для Stars
    if (activeTab === 'stars' && !isRegistered) {
      return
    }

    if (isEnergyFull) {
      return
    }

    setLoadingAmount(amount)
    try {
      if (activeTab === 'stars') {
        await onBuyStars(amount)
      } else {
        await onBuyTon(amount)
      }
    } finally {
      setLoadingAmount(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl shadow-purple-500/20">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/50"
          disabled={isBuying}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/30">
            ⚡
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Купить энергию</h3>
            <p className="text-sm text-slate-400">
              Баланс: <span className="text-yellow-400 font-bold">{userStars.toLocaleString()} ⭐</span>
            </p>
            <p className="text-xs text-slate-500">
              Энергия: <span className="text-cyan-400">{currentEnergy} / {maxEnergy}</span>
            </p>
          </div>
        </div>

        {/* 🔥 Баннер для незарегистрированных (только для Stars) */}
        {!isRegistered && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-400">
                  🔒 Только для зарегистрированных
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Войдите в аккаунт, чтобы покупать энергию за Stars и сохранять прогресс
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  🔐 Войти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 Баннер, если энергия полна */}
        {isEnergyFull && isRegistered && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs font-medium text-green-400">Энергия полна!</p>
                <p className="text-[10px] text-slate-400">Потратьте энергию перед покупкой</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('stars')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stars'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⭐ Stars
          </button>
          <button
            onClick={() => setActiveTab('ton')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ton'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ₿ TON
          </button>
        </div>

        <div className="space-y-2.5">
          {Object.entries(activeTab === 'stars' ? STARS_PRICES : TON_PRICES).map(([amount, price]) => {
            const numAmount = parseInt(amount) as EnergyAmount
            const isMaxed = isEnergyFull
            const hasEnough = activeTab === 'stars' ? canAffordStars(price) : true
            const isStarsLocked = activeTab === 'stars' && !isRegistered
            const isDisabled = isBuying || loadingAmount === numAmount || isMaxed || !hasEnough || isStarsLocked

            return (
              <button
                key={amount}
                onClick={() => handleBuy(numAmount)}
                disabled={isDisabled}
                className={`w-full p-3.5 rounded-xl flex justify-between items-center transition-all ${
                  isDisabled
                    ? 'bg-slate-800/50 opacity-40 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <div className="text-left">
                    <span className="font-medium text-white">{amount}</span>
                    <span className="text-xs text-slate-500 block">
                      {isMaxed 
                        ? '✅ Максимум' 
                        : !hasEnough && activeTab === 'stars' 
                          ? '❌ Не хватает ⭐'
                          : isStarsLocked
                            ? '🔒 Только для зарегистрированных'
                            : ''}
                    </span>
                  </div>
                </span>
                <span className={`font-bold flex items-center gap-1 ${
                  activeTab === 'stars' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {loadingAmount === numAmount ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : activeTab === 'stars' ? (
                    `${price} ⭐`
                  ) : (
                    `${formatTonPrice(price)} ₿`
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {activeTab === 'stars' 
              ? '⭐ Покупайте энергию за реальные Stars из Telegram!' 
              : '₿ Покупайте энергию за TON!'}
          </p>
        </div>

        <div className="mt-3 flex justify-between text-xs text-slate-500">
          <span>⭐ {userStars.toLocaleString()}</span>
          <span>⚡ {currentEnergy} / {maxEnergy}</span>
        </div>
      </div>
    </div>
  )
}