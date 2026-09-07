import { TonClient } from '@ton/ton'
import { Address } from '@ton/core'
import { prisma } from './prisma' // Убедитесь, что путь к вашему файлу инстанса prisma корректен (например, @/lib/prisma)
import { PRODUCTS } from '@/config/products'

let isChecking = false

export function initTonPaymentWorker() {
  const endpoint = process.env.TON_RPC_ENDPOINT?.trim()
  const walletAddressStr = process.env.MERCHANT_WALLET_ADDRESS?.trim()

  if (!endpoint || !walletAddressStr) {
    console.log(
      '⚠️ TON Worker: Пропущены настройки TON_RPC_ENDPOINT или MERCHANT_WALLET_ADDRESS в .env',
    )
    return
  }

  const tonClient = new TonClient({ endpoint })
  let merchantAddress: Address

  try {
    merchantAddress = Address.parse(walletAddressStr)
  } catch (error) {
    console.error(
      '❌ TON Worker: Ошибка парсинга адреса MERCHANT_WALLET_ADDRESS:',
      error,
    )
    return
  }

  console.log(
    `📡 TON Worker успешно запущен. Мониторинг сети через: ${endpoint}`,
  )

  setInterval(async () => {
    if (isChecking) return
    isChecking = true

    try {
      // Запрашиваем последние 15 транзакций кошелька мерчанта из блокчейна TON
      const transactions = await tonClient.getTransactions(merchantAddress, {
        limit: 15,
      })

      for (const tx of transactions) {
        // Проверяем наличие входящего сообщения и его тела
        if (!tx.inMessage || !tx.inMessage.body) continue

        let memoComment = ''
        try {
          const slice = tx.inMessage.body.beginParse()
          // Проверяем префикс текстового комментария (0x00000000)
          if (slice.remainingBits >= 32 && slice.preloadUint(32) === 0) {
            slice.skip(32)
            memoComment = slice.loadStringTail() // Считываем чистый текст memo
          }
        } catch {
          continue // Если не удалось распарсить тело сообщения, пропускаем транзакцию
        }

        // 🛡️ Проверяем маску нашего комментария: "order:ORDER_ID|user:USER_ID"
        if (!memoComment || !memoComment.startsWith('order:')) continue

        // Безопасный разбор строки комментария без вызова сплита на массиве
        const parts = memoComment.split('|')
        const orderPart = parts.find((p) => p.startsWith('order:'))
        if (!orderPart) continue

        const orderId = orderPart.split(':')[1] // Получаем чистый String ID транзакции из Prisma
        if (!orderId) continue

        // Ищем транзакцию в базе данных по первичному ключу id со статусом PENDING
        const pendingInvoice = await prisma.transaction.findFirst({
          where: {
            id: orderId,
            status: 'PENDING',
          },
        })

        if (pendingInvoice) {
          console.log(
            `🎰 TON Worker обнаружил оплату для заказа ${orderId}. Товар SKU: ${pendingInvoice.sku}`,
          )

          // Находим характеристики товара в официальном конфигурационном файле PRODUCTS
          const product = PRODUCTS.find((p) => p.id === pendingInvoice.sku)

          let userUpdateData: any = {}

          // Начисление в зависимости от категории товара
          if (pendingInvoice.sku === 'energy') {
            userUpdateData = { energy: { increment: 500 } } // Фолбек по умолчанию
          } else if (product) {
            if (product.category === 'energy') {
              userUpdateData = {
                energy: { increment: Number(product.effectValue) },
              }
            } else if (product.category === 'level') {
              userUpdateData = {
                level: { increment: Number(product.effectValue) },
                points: { increment: 50 }, // Добавляем очки за уровень согласно описанию из config/products.ts
              }
            } else if (product.category === 'vip') {
              userUpdateData = {
                vipUntil: new Date(
                  Date.now() +
                    Number(product.effectValue) * 24 * 60 * 60 * 1000,
                ),
              }
            } else if (product.category === 'skin') {
              userUpdateData = { skin: String(product.effectValue) }
            }
          }

          // Выполняем атомарное обновление статуса заказа и баланса пользователя внутри транзакции СУБД
          // Статус изменен на SUCCESS согласно вашей обновленной схеме Prisma v7/8
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: pendingInvoice.id },
              data: {
                status: 'SUCCESS', // 👈 Исправлено: строго SUCCESS вместо COMPLETED
                completedAt: new Date(),
                applied: true,
              },
            }),
            prisma.user.update({
              where: { id: pendingInvoice.userId },
              data: userUpdateData,
            }),
          ])

          console.log(
            `✅ TON Worker успешно зачислил товар для заказа ${orderId} пользователю ${pendingInvoice.userId}`,
          )
        }
      }
    } catch (error) {
      // Ловим и логируем ошибки RPC-ноды, чтобы интервал не умирал из-за сетевых сбоев
      console.error('⚠️ TON Worker RPC Loop Error:', error)
    } finally {
      isChecking = false
    }
  }, 5000) // Опрос блокчейна каждые 5 секунд
}
