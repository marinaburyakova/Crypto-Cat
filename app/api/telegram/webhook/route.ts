// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 🔥 Проверяем секрет (если настроен)
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    
    if (expectedSecret && secret !== expectedSecret) {
      console.error('❌ Invalid secret token!')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔥 Получаем тело запроса
    const body = await request.json()
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2))

    // 🔥 Обработка pre-checkout запроса (перед оплатой)
    if (body.pre_checkout_query) {
      const query = body.pre_checkout_query
      console.log('💳 Pre-checkout query:', query)
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: true,
        })
      })
      
      console.log('✅ Pre-checkout answered')
      return NextResponse.json({ ok: true })
    }

    // 🔥 Обработка успешного платежа
    if (body.message?.successful_payment) {
      const userId = body.message.from.id.toString()
      const payment = body.message.successful_payment
      const payload = payment.invoice_payload
      
      console.log(`💰 Payment successful! User: ${userId}`, payment)
      
      // 🔥 Определяем тип платежа из payload
      const parts = payload.split('_')
      const currency = parts[0] // 'stars' или 'ton'
      const type = parts[1]     // 'energy', 'boost', 'level', 'vip'
      
      // 🔥 Обновляем транзакцию
      await prisma.transaction.updateMany({
        where: { payload: payload },
        data: { 
          status: 'COMPLETED', 
          completedAt: new Date(),
          applied: true,
        }
      })

      // 🔥 Обработка в зависимости от валюты и типа
      if (currency === 'stars') {
        console.log(`⭐ Stars Payment: ${type} for user ${userId}`)
      } else if (currency === 'ton') {
        console.log(`₿ TON Payment: ${type} for user ${userId}`)
      }

      // 🔥 Обработка в зависимости от типа
      if (type === 'energy') {
        const energyAmount = parseInt(parts[2])
        
        // Начисляем энергию
        await prisma.user.update({
          where: { id: userId },
          data: {
            energy: { increment: energyAmount }
          }
        })
        
        console.log(`✅ Energy added: ${energyAmount} to user ${userId}`)
      } 
      else if (type === 'boost') {
        const boostType = parts[2]
        const boostValue = parseInt(parts[3])
        
        // Начисляем буст
        const boostUpdates: Record<string, any> = {
          speed: { speed: { increment: boostValue } },
          multiplier: { multiplier: { increment: boostValue } },
          passive: { passiveRate: { increment: boostValue } },
          max_energy: { maxEnergy: { increment: boostValue } },
        }
        
        await prisma.user.update({
          where: { id: userId },
          data: boostUpdates[boostType] || {}
        })
        
        console.log(`✅ Boost added: ${boostType} +${boostValue} to user ${userId}`)
      }
      else if (type === 'level') {
        const levelValue = parseInt(parts[2])
        
        // Повышаем уровень
        await prisma.user.update({
          where: { id: userId },
          data: {
            level: { increment: levelValue }
          }
        })
        
        console.log(`✅ Level +${levelValue} to user ${userId}`)
      }
      else if (type === 'vip') {
        const days = parseInt(parts[2])
        
        // Активируем VIP
        await prisma.user.update({
          where: { id: userId },
          data: {
            vipUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          }
        })
        
        console.log(`✅ VIP activated for ${days} days for user ${userId}`)
      }
      
      return NextResponse.json({ ok: true })
    }

    // 🔥 Обработка обычных сообщений
    if (body.message) {
      console.log('💬 Message from:', body.message.from?.id)
      console.log('📝 Text:', body.message.text)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}