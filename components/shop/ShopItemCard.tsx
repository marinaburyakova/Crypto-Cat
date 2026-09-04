// components/shop/ShopItemCard.tsx
'use client'

import { StarsPaymentButton } from '../game/StarsPaymentButton'
import { ShopItemCardProps } from '@/types/shop'


export function ShopItemCard({
  item,
  userId,
  onBuyTon,
  onSuccess,
  onError,
  isRefreshing,
  canAfford,
}: ShopItemCardProps) {
  const Icon = item.icon

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
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className={`w-5 h-5 ${item.color}`} />
            <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
            {item.popular && (
              <span className="text-[10px] bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-400 px-2 py-0.5 rounded-full font-bold animate-pulse border border-amber-500/20">
                🔥 ХИТ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {/* Кнопка TON */}
        <button
          onClick={() => onBuyTon(item)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRefreshing}
        >
          <span className="text-sm">₿</span>
          {item.priceTon} TON
        </button>

        {/* Кнопка Stars */}
        <StarsPaymentButton
          userId={userId}
          itemPriceStars={item.priceStars}
          itemSku={item.id}
          itemName={item.name}
          onSuccess={onSuccess}
          onError={onError}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 active:scale-95 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRefreshing || !canAfford}
        />
      </div>
    </div>
  )
}
