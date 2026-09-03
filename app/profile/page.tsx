// app/profile/page.tsx
import { prisma } from '@/lib/prisma'
import { redis, safeRedis } from '@/lib/redis'
import { BottomNav } from '@/components/ui/bottom-nav'
import {
  User,
  ShieldAlert,
  Award,
  Calendar,
  Zap,
  TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ✅ Определяем тип UserData под вашу схему
interface UserData {
  id: string
  points: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  unclaimedPoints: number
  passiveRate: number
  createdAt: Date
  updatedAt: Date
}

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

const getUserId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe
        ?.user as TelegramUser
      if (tgUser?.id) {
        return tgUser.id.toString()
      }
    } catch (error) {
      console.warn('⚠️ Error getting Telegram user:', error)
    }
  }
  return process.env.DEFAULT_USER_ID || 'guest_user_demo_1337'
}

// ✅ Маппер из PostgreSQL в UserData
const mapDbUserToUserData = (dbUser: any): UserData | null => {
  if (!dbUser) return null

  return {
    id: dbUser.id,
    points: Number(dbUser.points) || 0,
    energy: 1000, // В вашей схеме нет energy, ставим по умолчанию
    maxEnergy: 1000, // В вашей схеме нет maxEnergy, ставим по умолчанию
    level: dbUser.level || 1,
    exp: 0, // В вашей схеме нет exp, ставим по умолчанию
    unclaimedPoints: Number(dbUser.unclaimedPoints) || 0,
    passiveRate: dbUser.passiveRate || 0,
    createdAt: dbUser.createdAt || new Date(),
    updatedAt: dbUser.updatedAt || new Date(),
  }
}

// ✅ Маппер из Redis в UserData
const mapRedisUserToUserData = (redisUser: any): UserData | null => {
  if (!redisUser || Object.keys(redisUser).length === 0) return null

  return {
    id: redisUser.id || '',
    points: parseInt(redisUser.points || '0'),
    energy: parseInt(redisUser.energy || '1000'),
    maxEnergy: parseInt(redisUser.maxEnergy || '1000'),
    level: parseInt(redisUser.level || '1'),
    exp: parseInt(redisUser.exp || '0'),
    unclaimedPoints: parseInt(redisUser.unclaimedPoints || '0'),
    passiveRate: parseInt(redisUser.passiveRate || '0'),
    createdAt: redisUser.createdAt ? new Date(redisUser.createdAt) : new Date(),
    updatedAt: redisUser.updatedAt ? new Date(redisUser.updatedAt) : new Date(),
  }
}

export default async function ProfilePage() {
  const activeUserId = getUserId()

  if (!prisma) {
    console.error('❌ Prisma client is not initialized')
    return <ErrorFallback message="Ошибка инициализации базы данных" />
  }

  try {
    let userData: UserData | null = null
    let redisAvailable = false

    // ✅ Пытаемся получить из Redis
    try {
      await redis.ping()
      redisAvailable = true

      const redisUser = await safeRedis.hgetall(`user:${activeUserId}`)
      if (redisUser && Object.keys(redisUser).length > 0) {
        userData = mapRedisUserToUserData(redisUser)
        console.log('✅ User data loaded from Redis')
      }
    } catch (redisError) {
      console.warn('⚠️ Redis unavailable, using PostgreSQL fallback')
    }

    // ✅ Если Redis не доступен, берем из PostgreSQL
    if (!userData) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: activeUserId },
        })

        if (dbUser) {
          userData = mapDbUserToUserData(dbUser)
          console.log('✅ User data loaded from PostgreSQL')
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError)

        // ✅ Создаем пользователя в PostgreSQL если его нет
        try {
          const newUser = await prisma.user.create({
            data: {
              id: activeUserId,
              points: 0,
              unclaimedPoints: 0,
              level: 1,
              passiveRate: 0,
              nonce: 0,
            },
          })
          userData = mapDbUserToUserData(newUser)
          console.log('✅ New user created in PostgreSQL')
        } catch (createError) {
          console.error('❌ Failed to create user:', createError)
        }
      }
    }

    // ✅ Если пользователь не найден - создаем дефолтного
    if (!userData) {
      userData = {
        id: activeUserId,
        points: 0,
        energy: 1000,
        maxEnergy: 1000,
        level: 1,
        exp: 0,
        unclaimedPoints: 0,
        passiveRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      console.log('✅ Using default user data')
    }

    // ✅ Рассчитываем метрики
    const totalClicks = Math.floor(userData.points / 10)
    const nextLevelExp = userData.level * 500
    const progressToNextLevel = Math.min(
      100,
      (userData.exp / nextLevelExp) * 100,
    )
    const daysInGame = Math.floor(
      (Date.now() - new Date(userData.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    )

    return (
      <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
        {/* Градиентный фон */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
          <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[130px] animate-pulse [animation-duration:4s]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-600/15 blur-[100px] animate-pulse [animation-duration:6s]" />
        </div>

        <header className="relative z-10 p-4 bg-slate-900/70 border-b border-slate-800 backdrop-blur-md">
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" /> ПРОФИЛЬ КИБЕР-ТАПЕРА
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ваши on-chain достижения и статистика
          </p>
          {/* Индикатор статуса Redis */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${redisAvailable ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-[10px] text-slate-500">
              {redisAvailable
                ? 'Redis online'
                : 'Redis offline (используется PostgreSQL)'}
            </span>
          </div>
        </header>

        {/* Блок статистики */}
        <div className="relative z-10 flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 space-y-3.5 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-500" /> Всего накликано:
              </span>
              <span className="text-sm font-mono font-black text-amber-400">
                {userData.points.toLocaleString()} ⚡
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> Энергия:
              </span>
              <span className="text-sm font-mono font-black text-cyan-400">
                {userData.energy} / {userData.maxEnergy}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-400" /> RPG Уровень
                кота:
              </span>
              <span className="text-sm font-mono font-black text-purple-400">
                {userData.level} LVL
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Нераспределенные
                очки:
              </span>
              <span className="text-sm font-mono font-black text-emerald-400">
                {userData.unclaimedPoints.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Пассивный
                доход:
              </span>
              <span className="text-sm font-mono font-black text-cyan-400">
                {userData.passiveRate} ⚡/ч
              </span>
            </div>

            {/* Прогресс до следующего уровня */}
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Прогресс до
                LVL {userData.level + 1}:
              </span>
              <span className="text-sm font-mono font-black text-emerald-400">
                {userData.exp} / {nextLevelExp} XP
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" /> Дней в игре:
              </span>
              <span className="text-sm font-mono font-black text-cyan-400">
                {daysInGame} дн.
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" /> Регистрация:
              </span>
              <span className="text-xs font-mono text-slate-300">
                {userData.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Сегодня'}
              </span>
            </div>
          </div>

          {/* Статистика кликов */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3 h-3" /> Статистика кликов
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Всего кликов</p>
                <p className="text-lg font-black text-amber-400">
                  {totalClicks.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Средний клик</p>
                <p className="text-lg font-black text-cyan-400">10 ⚡</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center space-y-1">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center justify-center gap-2">
              <Award className="w-4 h-4" /> Airdrop Статус
            </h4>
            <p className="text-xs text-slate-400">
              Снимок сети (Snapshot) еще не сделан. Продолжайте копить ядра для
              максимизации дропа токенов! 🚀
            </p>
            <div className="mt-2 text-[10px] text-slate-500">
              {userData.points >= 1000
                ? '⭐ Претендент на дроп'
                : '⚡ Копите больше ядер!'}
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full">
          <BottomNav activeTab="profile" />
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ Profile page error:', error)
    return <ErrorFallback message="Ошибка загрузки профиля" />
  }
}

// Компонент ошибки
function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-50 overflow-hidden justify-between">
      <header className="p-4 bg-slate-900/70 border-b border-slate-800 backdrop-blur-md">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" /> ПРОФИЛЬ КИБЕР-ТАПЕРА
        </h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">😿</div>
          <h2 className="text-lg font-bold text-slate-200">
            Ошибка загрузки профиля
          </h2>
          <p className="text-sm text-slate-400">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      <div className="w-full">
        <BottomNav activeTab="profile" />
      </div>
    </div>
  )
}
