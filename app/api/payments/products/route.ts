// app/api/payments/products/route.ts
import { NextResponse } from 'next/server'

export const SHOP_ITEMS = [
  // ⚡ Энергия
  {
    id: 'energy_100',
    name: '100 энергии',
    description: 'Пополни запас энергии для кликов',
    icon: '⚡',
    priceTon: '0.5',
    priceStars: 50,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    effect: 'energy',
    effectValue: 100,
    popular: true,
    category: 'energy',
  },
  {
    id: 'energy_500',
    name: '500 энергии',
    description: 'Большой запас энергии',
    icon: '⚡⚡',
    priceTon: '2.0',
    priceStars: 200,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    effect: 'energy',
    effectValue: 500,
    popular: true,
    category: 'energy',
  },
  {
    id: 'energy_1000',
    name: '1000 энергии',
    description: 'Максимальный запас энергии',
    icon: '⚡⚡⚡',
    priceTon: '3.5',
    priceStars: 350,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    effect: 'energy',
    effectValue: 1000,
    popular: false,
    category: 'energy',
  },

  // 🚀 Бусты для кота
  {
    id: 'boost_speed',
    name: 'Буст скорости',
    description: 'Кликай быстрее! Увеличивает скорость клика',
    icon: '🚀',
    priceTon: '1.5',
    priceStars: 150,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    effect: 'speed',
    effectValue: 1,
    popular: false,
    category: 'boost',
  },
  {
    id: 'boost_multiplier',
    name: 'Множитель дохода',
    description: 'Каждый клик приносит в 2 раза больше ⭐',
    icon: '💰',
    priceTon: '3.0',
    priceStars: 300,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    effect: 'multiplier',
    effectValue: 2,
    popular: true,
    category: 'boost',
  },
  {
    id: 'boost_passive',
    name: 'Пассивный доход',
    description: 'Кот приносит звёзды даже когда ты не кликаешь',
    icon: '🏠',
    priceTon: '5.0',
    priceStars: 500,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    effect: 'passive',
    effectValue: 5,
    popular: false,
    category: 'boost',
  },
  {
    id: 'boost_max_energy',
    name: 'Увеличение энергии',
    description: 'Максимальный запас энергии увеличивается',
    icon: '💪',
    priceTon: '4.0',
    priceStars: 400,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    effect: 'max_energy',
    effectValue: 50,
    popular: false,
    category: 'boost',
  },

  // 📈 Уровень
  {
    id: 'level_up',
    name: 'Повышение уровня',
    description: 'Повысь уровень кота и получи бонусы',
    icon: '📈',
    priceTon: '2.0',
    priceStars: 200,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    effect: 'level',
    effectValue: 1,
    popular: false,
    category: 'level',
  },

  // 👑 VIP
  {
    id: 'vip_30days',
    name: 'VIP на 30 дней',
    description: 'Эксклюзивные бонусы и привилегии',
    icon: '👑',
    priceTon: '10.0',
    priceStars: 1000,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    effect: 'vip',
    effectValue: 30,
    popular: true,
    category: 'vip',
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      products: SHOP_ITEMS,
    })
  } catch (error) {
    console.error('❌ Products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
