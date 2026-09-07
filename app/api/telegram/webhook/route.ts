import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    
    if (expectedSecret && secret !== expectedSecret) {
      console.error('❌ Invalid secret token!')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2))

    // 1. ✅ Обработка pre-checkout запроса (Telegram Stars требует моментального ответа 'ok: true')
    if (body.pre_checkout_query) {
      const query = body.pre_checkout_query
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

    // 2. ✅ Обработка успешного платежа Telegram Stars / Invoices
    if (body.message?.successful_payment) {
      const userId = body.message.from.id.toString()
      const payment = body.message.successful_payment
      const payload = payment.invoice_payload // Формат: boost_boost_speed_userId_timestamp или energy_userId_timestamp
      
      console.log(`💰 Payment successful! User: ${userId}`, payment)
      
      // ✅ Обновляем транзакцию (Переведено на SUCCESS согласно нашей схеме Prisma v7/8)
      await prisma.transaction.updateMany({
        where: { payload: payload },
        data: { 
          status: 'SUCCESS', // 👈 Исправлено: вместо COMPLETED пишем SUCCESS
          completedAt: new Date(),
          applied: true,
        }
      })

      const parts = payload.split('_')
      const mainType = parts[0] // 'boost' или 'energy'

      // 📦 НАЧИСЛЕНИЕ: Энергия
      if (mainType === 'energy') {
        // По умолчанию за покупку энергии через buy-stars даем фиксированное число, 
        // либо вытаскиваем его, если вы переформатируете payload. Допустим, даем 500 энергии:
        await prisma.user.update({
          where: { id: userId },
          data: {
            energy: { increment: 500 }
          }
        })
        console.log(`✅ Energy added to user ${userId}`)
      } 
      // 📦 НАЧИСЛЕНИЕ: Бусты
      else if (mainType === 'boost') {
        const boostType = parts[2] // 'speed', 'multiplier', 'passive', 'max'
        
        if (boostType === 'passive') {
          await prisma.user.update({
            where: { id: userId },
            data: { passiveRate: { increment: 5 } } // Добавляем +5 к пассивному доходу
          })
          console.log(`✅ Passive rate increased for user ${userId}`)
        } 
        else if (boostType === 'speed' || boostType === 'multiplier') {
          // Так как полей speed/multiplier в User нет, прокачиваем уровень кота!
          await prisma.user.update({
            where: { id: userId },
            data: { level: { increment: 1 } }
          })
          console.log(`✅ Level increased (as speed/multiplier boost) for user ${userId}`)
        }
        else if (boostType === 'max') { // 'max_energy'
          await prisma.user.update({
            where: { id: userId },
            data: { maxEnergy: { increment: 250 } }
          })
          console.log(`✅ Max energy increased for user ${userId}`)
        }
      }
      // 📦 НАЧИСЛЕНИЕ: Прочие типы (Уровень / VIP)
      else if (mainType === 'level') {
        await prisma.user.update({
          where: { id: userId },
          data: { level: { increment: 1 } }
        })
      }
      else if (mainType === 'vip') {
        await prisma.user.update({
          where: { id: userId },
          data: { vipUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        })
      }
      
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
