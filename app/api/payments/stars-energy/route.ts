// app/api/payments/stars-energy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Цены в Stars
const ENERGY_PRICES = {
  100: 50,    // 100 энергии = 50 Stars
  500: 200,   // 500 энергии = 200 Stars
  1000: 350,  // 1000 энергии = 350 Stars
  5000: 1500, // 5000 энергии = 1500 Stars
} as const;

type EnergyAmount = keyof typeof ENERGY_PRICES;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount } = body;

    // ✅ Валидация
    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount' },
        { status: 400 }
      );
    }

    const energyAmount = Number(amount);
    if (!ENERGY_PRICES[energyAmount as EnergyAmount]) {
      return NextResponse.json(
        { error: 'Invalid energy amount' },
        { status: 400 }
      );
    }

    const starsCost = ENERGY_PRICES[energyAmount as EnergyAmount];

    // ✅ Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ Проверяем, хватает ли Stars
    const userStars = Number(user.points) || 0;
    if (userStars < starsCost) {
      return NextResponse.json(
        { 
          error: 'Not enough Stars',
          required: starsCost,
          balance: userStars,
        },
        { status: 400 }
      );
    }

    // ✅ Проверяем максимальную энергию
    const currentEnergy = Number(user.energy) || 1000;
    const maxEnergy = Number(user.maxEnergy) || 1000;
    
    if (currentEnergy >= maxEnergy) {
      return NextResponse.json(
        { 
          error: 'Energy is full',
          current: currentEnergy,
          max: maxEnergy,
        },
        { status: 400 }
      );
    }

    // ✅ Рассчитываем новую энергию (не больше максимума)
    const newEnergy = Math.min(maxEnergy, currentEnergy + energyAmount);
    const energyAdded = newEnergy - currentEnergy;

    // ✅ Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: { decrement: starsCost }, // Списываем Stars
        energy: newEnergy,                 // Добавляем энергию
      },
    });

    // ✅ Создаем запись о транзакции
    await prisma.transaction.create({
      data: {
        userId,
        amount: starsCost,
        currency: 'STARS',
        payload: `energy_${energyAmount}_${Date.now()}`,
        sku: `energy_${energyAmount}`,
        itemName: `${energyAmount} энергии`,
        status: 'SUCCESS',
        metadata: {
          energyAdded,
          energyBefore: currentEnergy,
          energyAfter: newEnergy,
          starsCost,
        },
      },
    });

    return NextResponse.json({
      success: true,
      starsRemaining: Number(updatedUser.points),
      energy: Number(updatedUser.energy),
      energyAdded,
      maxEnergy: Number(updatedUser.maxEnergy),
    });

  } catch (error) {
    console.error('❌ Stars energy purchase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}