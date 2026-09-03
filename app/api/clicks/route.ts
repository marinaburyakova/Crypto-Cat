// app/api/clicks/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Временное хранилище в памяти (для демо)
// В реальном проекте используйте базу данных
const userData: Record<string, { points: number; energy: number; maxEnergy: number }> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, clicks } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      )
    }

    // Инициализируем пользователя если его нет
    if (!userData[userId]) {
      userData[userId] = {
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
      }
    }

    const user = userData[userId]

    // Если есть клики - обрабатываем их
    if (clicks && clicks > 0) {
      // Проверяем достаточно ли энергии
      if (user.energy < clicks) {
        return NextResponse.json(
          { error: 'Not enough energy' },
          { status: 400 }
        )
      }

      // Начисляем очки (10 за каждый клик)
      user.points += clicks * 10
      // Тратим энергию
      user.energy -= clicks
    }

    // Возвращаем обновленные данные
    return NextResponse.json({
      success: true,
      points: user.points,
      energy: user.energy,
      maxEnergy: user.maxEnergy,
    })
  } catch (error) {
    console.error('Error processing clicks:', error)
    return NextResponse.json(
      { error: 'Failed to process clicks' },
      { status: 500 }
    )
  }
}

// GET метод для получения данных пользователя
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      )
    }

    // Инициализируем пользователя если его нет
    if (!userData[userId]) {
      userData[userId] = {
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
      }
    }

    const user = userData[userId]

    return NextResponse.json({
      success: true,
      points: user.points,
      energy: user.energy,
      maxEnergy: user.maxEnergy,
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}