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
      await fetch(
        `https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pre_checkout_query_id: query.id,
            ok: true,
          }),
        },
      )

      console.log('✅ Pre-checkout answered')
      return NextResponse.json({ ok: true })
    }

    // 🔥 Обработка успешного платежа
    if (body.message?.successful_payment) {
      const payment = body.message.successful_payment
      const telegramId = body.message.from.id.toString() // ID из Telegram
      const payload = payment.invoice_payload

      console.log(`💰 Payment successful! User: ${telegramId}`, payment)

      // Извлекаем количество энергии из payload
      const parts = payload.split('_')
      const amount = parseInt(parts[2]) || 100

      // 🔥 Начисляем энергию пользователю
      try {
        // Используем id как telegramId
        const user = await prisma.user.findUnique({
          where: { id: telegramId },
        })

        if (user) {
          const currentEnergy = Number(user.energy) || 1000
          const maxEnergy = Number(user.maxEnergy) || 1000
          const newEnergy = Math.min(maxEnergy, currentEnergy + amount)

          // Обновляем энергию
          await prisma.user.update({
            where: { id: telegramId },
            data: {
              energy: newEnergy,
            },
          })

          // Создаем запись о транзакции
          await prisma.transaction.create({
            data: {
              userId: telegramId,
              amount: payment.total_amount / 100, // Цена в Stars
              currency: 'STARS',
              status: 'COMPLETED',
              payload: payload,
              sku: `energy_${amount}`,
              itemName: `${amount} энергии`,
              metadata: {
                telegramPayment: payment,
                energyAdded: amount,
                energyBefore: currentEnergy,
                energyAfter: newEnergy,
              },
              completedAt: new Date(),
            },
          })

          console.log(
            `✅ Energy added: ${amount} (${currentEnergy} → ${newEnergy})`,
          )
        } else {
          console.log(`⚠️ User not found: ${telegramId}`)
        }
      } catch (error) {
        console.error('❌ Error updating user energy:', error)
      }

      return NextResponse.json({ ok: true })
    }

    // 🔥 Обработка обычных сообщений
    if (body.message) {
      console.log('💬 Message from:', body.message.from?.id)
      console.log('📝 Text:', body.message.text)

      // Можно добавить ответные сообщения здесь
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    )
  }
}
