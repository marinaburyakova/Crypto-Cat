// components/game/TonPaymentModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { X, CheckCircle, Loader2 } from 'lucide-react'

interface TonModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  itemPriceTon: string
  itemSku: string
  itemName: string
}

export function TonPaymentModal({
  userId,
  isOpen,
  onClose,
  itemPriceTon,
  itemSku,
  itemName,
}: TonModalProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isPaid, setIsPaid] = useState<boolean>(false)

  useEffect(() => {
    if (!isOpen) {
      setIsPaid(false)
      setQrImageUrl('')
      return
    }

    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    async function generateInvoice() {
      if (!isMounted) return
      setLoading(true)

      try {
        const res = await fetch('/api/payments/ton-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, itemPriceTon, itemSku }),
        })
        const data = await res.json()

        if (!isMounted) return

        if (data.success && data.tonUri) {
          const qrCodeUrl = await QRCode.toDataURL(data.tonUri, {
            width: 250,
            margin: 2,
          })

          if (isMounted) {
            setQrImageUrl(qrCodeUrl)
            setLoading(false)
          }

          intervalId = setInterval(async () => {
            try {
              const checkRes = await fetch(
                `/api/payments/check-status?memo=${data.memo}`,
              )
              const checkData = await checkRes.json()

              if (!isMounted) return

              if (checkData.status === 'SUCCESS') {
                setIsPaid(true)
                if (intervalId) {
                  clearInterval(intervalId)
                  intervalId = null
                }
              }
            } catch {
              // Игнорируем ошибки полинга
            }
          }, 3000)
        }
      } catch {
        if (isMounted) setLoading(false)
      }
    }

    generateInvoice()

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, userId, itemPriceTon, itemSku])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          {!isPaid ? (
            <>
              <h3 className="text-lg font-bold text-zinc-100 mb-1">
                Оплата через TON
              </h3>
              <p className="text-xs text-amber-400 font-medium mb-4">
                Покупка: {itemName}
              </p>

              {loading ? (
                <div className="h-[258px] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs text-zinc-400">
                    Генерация безопасного инвойса...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {qrImageUrl && (
                    <img
                      src={qrImageUrl}
                      alt="TON Pay QR"
                      width={250}
                      height={250}
                      className="rounded-2xl border-4 border-white bg-white shadow-lg select-none pointer-events-none"
                    />
                  )}
                  <div className="space-y-1">
                    <p className="text-xl font-black text-white">
                      {itemPriceTon} TON
                    </p>
                    <p className="text-[11px] text-zinc-400 max-w-[250px] mx-auto leading-relaxed">
                      Отсканируйте QR-код кошельком Tonkeeper.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 flex flex-col items-center gap-4"
            >
              <CheckCircle className="w-16 h-16 text-emerald-500 animate-pulse" />
              <div>
                <h4 className="text-xl font-black text-white">
                  Оплата получена!
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Ваш бустер пассивного дохода успешно активирован.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Отлично
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
