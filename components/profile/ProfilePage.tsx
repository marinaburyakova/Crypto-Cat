// components/profile/ProfilePage.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'
import { useNotification } from '@/components/ui/Notification'
import { ProfileHeader } from './ProfileHeader'
import { ProfileStats } from './ProfileStats'
import { ProfileAchievement } from './ProfileAchievement'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, LogOut } from 'lucide-react'

export function ProfilePage() {
  const router = useRouter()
  const { showNotification, NotificationComponent } = useNotification()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  // 🔥 Редирект на логин, если нет пользователя
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🔓 Нет пользователя, редирект на /login')
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-950">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {NotificationComponent}

      <ProfileHeader userData={user} isGuest={false} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <ProfileStats userData={user} />
        <ProfileAchievement userData={user} />

        <button
          onClick={() => {
            logout()
            showNotification('info', '👋 Вы вышли из аккаунта')
            router.push('/login')
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium py-3 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </button>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  )
}