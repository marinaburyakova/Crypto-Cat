// app/api/payments/products/route.ts
import { NextResponse } from 'next/server'
import { getShopProducts } from '@/config/products'

export async function GET() {
  try {
    const products = getShopProducts()
    
    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error) {
    console.error('❌ Products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}