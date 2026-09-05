// components/shop/ShopHeader.tsx
'use client'

import React from 'react'
import { Sparkles, Crown, Zap, Loader2 } from 'lucide-react'

// Определение интерфейса UserData (должен соответствовать тому, что используется в ShopPage)
export interface UserData {
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

// Определение пропсов для компонента
export interface ShopHeaderProps {
  userData: UserData | null
  isRefreshing: boolean
  onRefresh: () => void
}

export function ShopHeader({
  userData,
  isRefreshing,
  onRefresh,
}: ShopHeaderProps) {
  // Проверка VIP статуса с валидацией даты
  const isVip = React.useMemo(() => {
    if (!userData?.vipUntil) return false

    try {
      const vipDate = new Date(userData.vipUntil)
      // Проверяем, что дата валидна
      if (isNaN(vipDate.getTime())) return false
      return vipDate > new Date()
    } catch {
      return false
    }
  }, [userData?.vipUntil])

  const handleRefresh = () => {
    if (!isRefreshing) {
      onRefresh()
    }
  }

  return (
    <header
      className="relative z-10 p-4 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl border-b border-slate-800/80"
      role="banner"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles
              className="w-5 h-5 text-amber-400"
              aria-hidden="true"
            />
            КИБЕР-МАГАЗИН
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Улучшайте своего питомца 🚀
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          aria-label="Обновить данные магазина"
        >
          <Loader2
            className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Статистика пользователя */}
      {userData && (
        <div
          className="mt-3 flex flex-wrap items-center gap-3 text-xs bg-slate-800/30 rounded-xl p-2.5 border border-slate-700/30"
          role="status"
          aria-label="Статистика пользователя"
        >
          <span
            className="text-slate-400"
            aria-hidden="true"
          >
            💰
          </span>
          <span className="text-amber-400 font-bold">
            {userData.points?.toLocaleString() || 0}
            <span className="text-slate-400 ml-1">очков</span>
          </span>

          <span
            className="w-px h-4 bg-slate-700/50"
            aria-hidden="true"
          />

          <span
            className="text-slate-400"
            aria-hidden="true"
          >
            🏆
          </span>
          <span className="text-purple-400 font-bold">
            {userData.level || 1} LVL
          </span>

          <span
            className="w-px h-4 bg-slate-700/50"
            aria-hidden="true"
          />

          <span
            className="text-slate-400"
            aria-hidden="true"
          >
            ⚡
          </span>
          <span className="text-cyan-400 font-bold">
            {userData.energy || 0}/{userData.maxEnergy || 1000}
          </span>

          {isVip && (
            <>
              <span
                className="w-px h-4 bg-slate-700/50"
                aria-hidden="true"
              />
              <span
                className="text-amber-400 flex items-center gap-1 font-bold"
                role="status"
                aria-label="VIP статус активен"
              >
                <Crown
                  className="w-3 h-3"
                  aria-hidden="true"
                />
                VIP
              </span>
            </>
          )}
        </div>
      )}
    </header>
  )
}
