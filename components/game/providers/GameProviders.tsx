// components/game/providers/GameProviders.tsx
'use client'

import { ReactNode } from 'react'
import { useTelegram } from '@/hooks/useTelegram'
import { useNotification } from '@/components/ui/Notification'

interface GameProvidersProps {
  children: (props: {
    hapticFeedback: (style?: any) => void
    notificationFeedback: (type?: any) => void
    showNotification: (type: any, message: string) => void
    NotificationComponent: ReactNode
  }) => ReactNode
}

export function GameProviders({ children }: GameProvidersProps) {
  const { hapticFeedback, notificationFeedback } = useTelegram()
  const { showNotification, NotificationComponent } = useNotification()

  return children({
    hapticFeedback,
    notificationFeedback,
    showNotification,
    NotificationComponent,
  })
}