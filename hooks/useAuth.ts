// hooks/useAuth.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

export interface AuthUser {
  id: string
  login: string
  points: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  passiveRate: number
  unclaimedPoints: number
  skin: string
  vipUntil: string | null
  totalSpent: number
  createdAt: string
}

interface UseAuthReturn {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (login: string, password: string) => Promise<void>
  register: (login: string, password: string) => Promise<void>
  logout: () => void
  userId: string
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 🔥 Загрузка при монтировании
  useEffect(() => {
    if (isInitialized) return

    const loadAuth = async () => {
      setIsLoading(true)

      const savedAuth = localStorage.getItem('catAuth')
      console.log('📦 savedAuth:', savedAuth)

      if (savedAuth) {
        try {
          const { id, login } = JSON.parse(savedAuth)

          if (id) {
            const response = await fetch(`/api/user/profile?userId=${id}`)

            if (response.ok) {
              const data = await response.json()
              console.log('✅ Загружены данные пользователя:', data.login)

              setUser({
                id: data.id,
                login: data.login || login,
                points: Number(data.points || 0),
                energy: data.energy || 1000,
                maxEnergy: data.maxEnergy || 1000,
                level: data.level || 1,
                exp: data.exp || 0,
                passiveRate: data.passiveRate || 0,
                unclaimedPoints: Number(data.unclaimedPoints || 0),
                skin: data.skin || 'default',
                vipUntil: data.vipUntil || null,
                totalSpent: data.totalSpent || 0,
                createdAt: data.createdAt || new Date().toISOString(),
              })
              setIsInitialized(true)
              setIsLoading(false)
              return
            } else {
              console.warn('⚠️ Пользователь не найден в БД, удаляем catAuth')
              localStorage.removeItem('catAuth')
            }
          }
        } catch (e) {
          console.error('❌ Ошибка загрузки auth:', e)
          localStorage.removeItem('catAuth')
        }
      }

      setUser(null)
      setIsInitialized(true)
      setIsLoading(false)
    }

    loadAuth()
  }, [isInitialized])

  // 🔐 Вход
  const login = useCallback(async (login: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа')
      }

      localStorage.setItem('catAuth', JSON.stringify({
        id: data.user.id,
        login: data.user.login
      }))

      setUser({
        id: data.user.id,
        login: data.user.login,
        points: Number(data.user.points || 0),
        energy: data.user.energy || 1000,
        maxEnergy: data.user.maxEnergy || 1000,
        level: data.user.level || 1,
        exp: data.user.exp || 0,
        passiveRate: data.user.passiveRate || 0,
        unclaimedPoints: Number(data.user.unclaimedPoints || 0),
        skin: data.user.skin || 'default',
        vipUntil: data.user.vipUntil || null,
        totalSpent: data.user.totalSpent || 0,
        createdAt: data.user.createdAt || new Date().toISOString(),
      })
      setIsInitialized(true)
      setIsLoading(false)

      console.log('✅ Вход выполнен, сохранён ID:', data.user.id)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа'
      console.error('❌ Ошибка входа:', message)
      setError(message)
      setIsLoading(false)
      throw err
    }
  }, [])

  // 📝 Регистрация
  const register = useCallback(async (login: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации')
      }

      localStorage.setItem('catAuth', JSON.stringify({
        id: data.user.id,
        login: data.user.login
      }))

      setUser({
        id: data.user.id,
        login: data.user.login,
        points: Number(data.user.points || 0),
        energy: data.user.energy || 1000,
        maxEnergy: data.user.maxEnergy || 1000,
        level: data.user.level || 1,
        exp: data.user.exp || 0,
        passiveRate: data.user.passiveRate || 0,
        unclaimedPoints: Number(data.user.unclaimedPoints || 0),
        skin: data.user.skin || 'default',
        vipUntil: data.user.vipUntil || null,
        totalSpent: data.user.totalSpent || 0,
        createdAt: data.user.createdAt || new Date().toISOString(),
      })
      setIsInitialized(true)
      setIsLoading(false)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка регистрации'
      console.error('❌ Ошибка регистрации:', message)
      setError(message)
      setIsLoading(false)
      throw err
    }
  }, [])

  // 🚪 Выход
  const logout = useCallback(() => {
    localStorage.removeItem('catAuth')
    setUser(null)
    setIsInitialized(false)
    setIsLoading(false)
  }, [])

  const userId = user?.id || ''

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    userId,
  }
}