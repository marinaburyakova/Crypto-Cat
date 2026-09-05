// components/game/GamePlayArea.tsx
'use client'

import { GameField } from './game-field'
import { GameCombo } from './GameCombo'
import { GameHeroBadge } from './GameHeroBadge'

interface GamePlayAreaProps {
  emotion: string
  energy: number
  onTap: (x: number, y: number) => void
  catModel: string
  catInfo: {
    name: string
    emoji: string
    text: string
    color?: string
    bgColor?: string
    borderColor?: string
  }
  isSuperhero: boolean
  isLegendary: boolean
  comboCount: number
}

export function GamePlayArea({
  emotion,
  energy,
  onTap,
  catModel,
  catInfo,
  isSuperhero,
  isLegendary,
  comboCount,
}: GamePlayAreaProps) {
  return (
    <div className="flex-1 relative min-h-0 overflow-hidden">
      <GameField
        emotion={emotion}
        energy={energy}
        onTap={onTap}
        catModel={catModel}
        catInfo={catInfo}
        isSuperhero={isSuperhero}
        isLegendary={isLegendary}
      />

      <GameCombo count={comboCount} />
      <GameHeroBadge
        isSuperhero={isSuperhero}
        isLegendary={isLegendary}
        catInfo={catInfo}
      />
    </div>
  )
}