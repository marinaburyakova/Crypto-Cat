// components/game/GameContainer.tsx
'use client'

import { ReactNode } from 'react'

interface GameContainerProps {
  children: ReactNode
  notificationComponent: ReactNode
}

export function GameContainer({ children, notificationComponent }: GameContainerProps) {
  return (
    <div className="relative flex flex-col h-full w-full">
      {notificationComponent}
      {children}
    </div>
  )
}