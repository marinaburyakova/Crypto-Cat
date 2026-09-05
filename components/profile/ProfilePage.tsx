// components/profile/ProfilePage.tsx
'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/ui/BottomNav'
import { useNotification } from '@/components/ui/Notification'
import { ProfileHeader } from './ProfileHeader'
import { ProfileStats } from './ProfileStats'
import { ProfileAchievement } from './ProfileAchievement'
import { AuthModal } from './AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, LogOut } from 'lucide-react'

export function ProfilePage() {
  const { showNotification, NotificationComponent } = useNotification()
  const { user, isAuthenticated, isLoading, error, login, register, logout, setGuest, isGuest } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-950">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    )
  }

  // Если пользователь не авторизован и не гость → показываем модалку
  if (!user && !isGuest) {
    return (
      <div className="h-full w-full bg-slate-950">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onLogin={login}
          onRegister={register}
          onGuest={setGuest}
          isLoading={isLoading}
          error={error}
        />
        <BottomNav activeTab="profile" />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {NotificationComponent}

      {isGuest && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
          <p className="text-yellow-400 text-sm">
            🟢 Вы играете как гость. При перезагрузке прогресс сбросится.
          </p>
        </div>
      )}

      <ProfileHeader userData={user!} isGuest={isGuest} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <ProfileStats userData={user!} />
        <ProfileAchievement userData={user!} />

        {!isGuest && isAuthenticated && (
          <button
            onClick={() => {
              logout()
              showNotification('info', '👋 Вы вышли из аккаунта')
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium py-3 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        )}

        {isGuest && (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 font-medium py-3 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Войти / Зарегистрироваться
          </button>
        )}
      </div>

      <BottomNav activeTab="profile" />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
        onGuest={setGuest}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}