// app/api/payments/products/route.ts
import { NextResponse } from 'next/server'

// 🔥 Цены для магазина (синхронизированы с ENERGY_PRICES)
const ENERGY_PRODUCTS = [
  {
    id: 'energy_100',
    name: '100 энергии',
    description: 'Пополните энергию на 100 единиц',
    price: 50,
    currency: 'STARS',
    amount: 100,
    icon: '⚡',
  },
  {
    id: 'energy_500',
    name: '500 энергии',
    description: 'Пополните энергию на 500 единиц',
    price: 200,
    currency: 'STARS',
    amount: 500,
    icon: '⚡⚡',
  },
  {
    id: 'energy_1000',
    name: '1000 энергии',
    description: 'Пополните энергию на 1000 единиц',
    price: 350,
    currency: 'STARS',
    amount: 1000,
    icon: '⚡⚡⚡',
  },
  {
    id: 'energy_5000',
    name: '5000 энергии',
    description: 'Максимальный запас энергии!',
    price: 1500,
    currency: 'STARS',
    amount: 5000,
    icon: '🌟',
    popular: true,
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      products: ENERGY_PRODUCTS,
    })
  } catch (error) {
    console.error('❌ Products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}