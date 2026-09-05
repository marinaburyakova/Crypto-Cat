// app/api/user/by-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const login = searchParams.get('login')

    if (!login) {
      return NextResponse.json(
        { success: false, error: 'Missing login' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { login: login },
          { id: login }, // если логин — это ID
        ],
      },
      select: {
        id: true,
        login: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      id: user.id,
      login: user.login,
    })
  } catch (error) {
    console.error('❌ User by login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
