// components/ui/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, ShoppingBag, User } from 'lucide-react'

interface BottomNavProps {
  activeTab?: 'game' | 'shop' | 'profile'
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const pathname = usePathname()

  const tabs = [
    { id: 'game', label: 'Игра', icon: Gamepad2, href: '/' },
    { id: 'shop', label: 'Магазин', icon: ShoppingBag, href: '/shop' },
    { id: 'profile', label: 'Профиль', icon: User, href: '/profile' },
  ] as const

  const getActiveTab = () => {
    if (activeTab) return activeTab
    if (pathname === '/') return 'game'
    if (pathname === '/shop') return 'shop'
    if (pathname === '/profile') return 'profile'
    return 'game'
  }

  const currentTab = getActiveTab()

  return (
    <div className="relative w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex-shrink-0">
      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          const Icon = tab.icon

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="group relative flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all duration-300"
            >
              {isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
              )}

              <Icon
                className={`
                  w-5 h-5 transition-all duration-300
                  ${
                    isActive
                      ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                  ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                `}
              />

              <span
                className={`
                  text-[10px] font-medium transition-all duration-300
                  ${
                    isActive
                      ? 'text-purple-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                `}
              >
                {tab.label}
              </span>

              {isActive && (
                <div className="absolute inset-0 -z-10 bg-purple-500/5 rounded-xl blur-xl transition-opacity group-hover:opacity-100" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
