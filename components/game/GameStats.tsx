// components/game/GameStats.tsx
'use client'

interface GameStatsProps {
  exp: number
  maxExp: number
  error?: string | null
  onRetry?: () => void
}

export function GameStats({ exp, maxExp = 500, error, onRetry }: GameStatsProps) {
  return (
    <div className="px-4 pb-2 space-y-2">
      <div className="flex justify-between text-[9px] font-mono text-slate-400">
        <span>ОПЫТ ДО СЛЕД. УРОВНЯ</span>
        <span>{exp} / {maxExp} XP</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${(exp / maxExp) * 100}%` }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="text-red-400 text-sm">⚠️</span>
          <p className="text-xs text-red-400 flex-1">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="text-xs text-red-400 hover:text-red-300 underline">
              Обновить
            </button>
          )}
        </div>
      )}
    </div>
  )
}