// components/shop/ShopItemCard.tsx
'use client'

import React from 'react'
import { StarsPaymentButton } from '../game/StarsPaymentButton'
import { ShopItem } from '@/types/shop'

interface ShopItemCardProps {
  item: ShopItem
  userId: string
  onBuyTon: (item: ShopItem) => void
  onSuccess: () => void
  onError: (error: string) => void
  isRefreshing: boolean
  canAfford: boolean
}

export function ShopItemCard({
  item,
  userId,
  onBuyTon,
  onSuccess,
  onError,
  isRefreshing,
  canAfford,
}: ShopItemCardProps) {
  const IconComponent = item.icon

  const isValidIcon = React.useMemo(() => {
    if (!IconComponent) return false
    return (
      typeof IconComponent === 'function' ||
      (typeof IconComponent === 'object' &&
        IconComponent.$$typeof === Symbol.for('react.forward_ref'))
    )
  }, [IconComponent])

  const Icon = isValidIcon
    ? IconComponent
    : () => <span className="w-5 h-5">📦</span>

  // 🔥 Определяем эмодзи для категорий
  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      energy: '⚡',
      boost: '🚀',
      level: '📈',
      vip: '👑',
      skin: '🎨',
      mega: '💎',
      other: '📦',
    }
    return emojis[category] || '📦'
  }

  // 🔥 Форматируем описание эффекта
  const getEffectDescription = (item: ShopItem) => {
    const effects: Record<string, string> = {
      energy: `+${item.effectValue} энергии`,
      speed: `+${item.effectValue} скорость клика`,
      multiplier: `x${item.effectValue} доход`,
      passive: `+${item.effectValue}/час пассивного дохода`,
      max_energy: `+${item.effectValue} макс. энергии`,
      level: `+${item.effectValue} уровень`,
      vip: `VIP на ${item.effectValue} дней`,
    }
    return effects[item.effect] || item.description
  }

  // 🔥 Определяем цвет для эффекта
  const getEffectColor = (effect: string) => {
    const colors: Record<string, string> = {
      energy: 'text-yellow-400',
      speed: 'text-blue-400',
      multiplier: 'text-green-400',
      passive: 'text-purple-400',
      max_energy: 'text-red-400',
      level: 'text-indigo-400',
      vip: 'text-amber-400',
    }
    return colors[effect] || 'text-slate-400'
  }

  return (
    <div
      className={`
        ${item.bgColor} border ${item.borderColor} 
        rounded-2xl p-4 
        shadow-lg hover:shadow-xl 
        transition-all duration-300 
        hover:scale-[1.02] active:scale-[0.98]
        group
      `}
      role="article"
      aria-label={`Товар: ${item.name}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-lg"
              aria-hidden="true"
            >
              {getCategoryEmoji(item.category)}
            </span>

            <Icon
              className={`w-5 h-5 ${item.color}`}
              aria-hidden="true"
            />

            <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>

            {item.popular && (
              <span
                className="text-[10px] bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-400 px-2 py-0.5 rounded-full font-bold animate-pulse border border-amber-500/20"
                role="status"
                aria-label="Популярный товар"
              >
                🔥 ХИТ
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {item.description}
          </p>

          <p
            className={`text-xs font-medium mt-1 ${getEffectColor(item.effect)}`}
          >
            {getEffectDescription(item)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {/* Кнопка TON */}
        <button
          type="button"
          onClick={() => onBuyTon(item)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRefreshing || !canAfford}
          aria-label={`Купить ${item.name} за ${item.priceTon} TON`}
        >
          <span aria-hidden="true">₿</span>
          {item.priceTon} TON
        </button>

        {/* Кнопка Stars */}
        <StarsPaymentButton
          userId={userId}
          itemPriceStars={item.priceStars}
          itemSku={item.id}
          itemName={item.name}
          itemCategory={item.category}
          itemEffect={item.effect}
          itemEffectValue={item.effectValue}
          onSuccess={onSuccess}
          onError={onError}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRefreshing || !canAfford}
        />
      </div>
    </div>
  )
}
