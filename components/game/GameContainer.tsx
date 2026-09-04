// components/game/GameContainer.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'

interface GameContainerProps {
  children: ReactNode
  notificationComponent: ReactNode
}

export function GameContainer({
  children,
  notificationComponent,
}: GameContainerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="relative flex flex-col h-full w-full">
      {notificationComponent}
      {children}
    </div>
  )
}
