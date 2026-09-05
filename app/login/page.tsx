// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/ui/BottomNav'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, register, isLoading, error } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    confirmPassword: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Валидация
    if (!formData.login.trim()) {
      setFormError('Введите логин')
      return
    }
    if (!formData.password) {
      setFormError('Введите пароль')
      return
    }
    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      setFormError('Пароли не совпадают')
      return
    }

    try {
      if (isLoginMode) {
        await login(formData.login, formData.password)
      } else {
        await register(formData.login, formData.password)
      }
      router.push('/profile')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка'
      setFormError(message)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🐱</div>
            <h1 className="text-2xl font-bold text-white">
              {isLoginMode ? 'Вход в игру' : 'Регистрация'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {isLoginMode
                ? 'Войдите, чтобы продолжить игру'
                : 'Создайте аккаунт за 1 минуту'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Логин */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Логин</label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                placeholder="Введите логин"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
                autoFocus
              />
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Введите пароль"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Подтверждение пароля (только при регистрации) */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Повторите пароль"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required={!isLoginMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Ошибка */}
            {(formError || error) && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {formError || error}
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLoginMode ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </button>

            {/* Переключение режима */}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode)
                setFormError(null)
                setFormData({
                  login: '',
                  password: '',
                  confirmPassword: '',
                })
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isLoginMode
                ? 'Нет аккаунта? Зарегистрируйтесь'
                : 'Уже есть аккаунт? Войдите'}
            </button>
          </form>
        </div>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  )
}