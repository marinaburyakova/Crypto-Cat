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
  setGuest: () => void
  isGuest: boolean
  userId: string
}

// 🎯 Создание гостевых данных
const createGuestUser = (): AuthUser => ({
  id: 'guest',
  login: 'Гость',
  points: 0,
  energy: 1000,
  maxEnergy: 1000,
  level: 1,
  exp: 0,
  passiveRate: 0,
  unclaimedPoints: 0,
  skin: 'default',
  totalSpent: 0,
  createdAt: new Date().toISOString(),
})

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  // Загрузка при монтировании
  useEffect(() => {
    const loadAuth = async () => {
      setIsLoading(true)
      
      // Проверяем авторизацию
      const savedAuth = localStorage.getItem('catAuth')
      if (savedAuth) {
        try {
          const { login } = JSON.parse(savedAuth)
          if (login) {
            const response = await fetch(`/api/user/profile?userId=${login}`)
            if (response.ok) {
              const data = await response.json()
              setUser({
                id: data.id,
                login: data.login,
                points: Number(data.points || 0),
                energy: data.energy || 1000,
                maxEnergy: data.maxEnergy || 1000,
                level: data.level || 1,
                exp: data.exp || 0,
                passiveRate: data.passiveRate || 0,
                unclaimedPoints: Number(data.unclaimedPoints || 0),
                skin: data.skin || 'default',
                totalSpent: data.totalSpent || 0,
                createdAt: data.createdAt || new Date().toISOString(),
              })
              setIsGuest(false)
              setIsLoading(false)
              return
            }
          }
        } catch (e) {
          console.error('Ошибка загрузки auth:', e)
        }
      }

      // Проверяем, гость ли пользователь
      const guestFlag = localStorage.getItem('catGuest')
      if (guestFlag === 'true') {
        setIsGuest(true)
        setUser(createGuestUser())
      } else {
        setUser(null)
        setIsGuest(false)
      }
      
      setIsLoading(false)
    }

    loadAuth()
  }, [])

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

      localStorage.setItem('catAuth', JSON.stringify({ login }))
      localStorage.removeItem('catGuest')
      
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
        totalSpent: data.user.totalSpent || 0,
        createdAt: data.user.createdAt || new Date().toISOString(),
      })
      setIsGuest(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

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

      localStorage.setItem('catAuth', JSON.stringify({ login }))
      localStorage.removeItem('catGuest')
      
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
        totalSpent: data.user.totalSpent || 0,
        createdAt: data.user.createdAt || new Date().toISOString(),
      })
      setIsGuest(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка регистрации'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('catAuth')
    localStorage.removeItem('catGuest')
    setUser(null)
    setIsGuest(false)
  }, [])

  const setGuest = useCallback(() => {
    localStorage.setItem('catGuest', 'true')
    localStorage.removeItem('catAuth')
    setIsGuest(true)
    setUser(createGuestUser())
  }, [])

  // 🔥 userId для передачи в GameUI
  const userId = user?.id || 'guest'

  return {
    user,
    isAuthenticated: !!user && !isGuest,
    isLoading,
    error,
    login,
    register,
    logout,
    setGuest,
    isGuest,
    userId, // ← добавляем
  }
}