// components/game/GameLoader.tsx
'use client'

export function GameLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-slate-950">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">🐱</span>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium">Загрузка игры...</p>
      </div>
    </div>
  )
}