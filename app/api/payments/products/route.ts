import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/config/products'
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      products: PRODUCTS,
    })
  } catch (error) {
    console.error('❌ Products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
