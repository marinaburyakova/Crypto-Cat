// components/profile/AuthModal.tsx
'use client'

import { useState } from 'react'
import { X, LogIn, UserPlus, User } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (login: string, password: string) => Promise<void>
  onRegister: (login: string, password: string) => Promise<void>
  onGuest: () => void
  isLoading?: boolean
  error?: string | null
}

export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onGuest,
  isLoading,
  error,
}: AuthModalProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!login.trim() || !password.trim()) return

    if (isLoginMode) {
      await onLogin(login.trim(), password.trim())
    } else {
      await onRegister(login.trim(), password.trim())
    }
    
    // Закрываем модалку после успеха
    if (!error) {
      onClose()
    }
  }

  const handleGuest = () => {
    onGuest()
    onClose()
  }

  function setError(arg0: string) {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md relative">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐱</div>
          <h2 className="text-xl font-bold text-white">
            {isLoginMode ? 'Вход в игру' : 'Регистрация'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLoginMode ? 'Войдите, чтобы продолжить игру' : 'Создайте новый аккаунт'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isLoading}
            />
            {!isLoginMode && (
              <p className="text-xs text-slate-500 mt-1">Минимум 6 символов</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !login.trim() || !password.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLoginMode ? (
              <>
                <LogIn className="w-4 h-4" /> Войти
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Зарегистрироваться
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-slate-500">или</span>
            </div>
          </div>

          {/* Кнопка "Играть как гость" */}
          <button
            type="button"
            onClick={handleGuest}
            className="w-full border border-zinc-700 hover:border-zinc-600 text-slate-400 hover:text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Играть как гость
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode)
              setError('')
            }}
            className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isLoginMode ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </form>
      </div>
    </div>
  )
}