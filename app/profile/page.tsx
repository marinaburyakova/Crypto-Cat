// app/profile/page.tsx
import { prisma } from '@/lib/prisma'
import { redis, safeRedis } from '@/lib/redis'
import { BottomNav } from '@/components/ui/bottom-nav'
import { cookies, headers } from 'next/headers'  // ✅ Добавлено
import {
  User,
  ShieldAlert,
  Award,
  Calendar,
  Zap,
  TrendingUp,
  Crown,
  Gem,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ✅ Обновленный интерфейс
interface UserData {
  id: string
  points: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  unclaimedPoints: number
  passiveRate: number
  skin: string
  vipUntil: Date | null
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

// ✅ Получение userId на сервере
async function getUserIdFromRequest(): Promise<string> {
  try {
    // Способ 1: Из заголовков (устанавливается в middleware)
    const headersList = await headers()
    const userIdFromHeader = headersList.get('x-user-id')
    if (userIdFromHeader) {
      return userIdFromHeader
    }

    // Способ 2: Из cookies
    const cookieStore = await cookies()
    const tgUserCookie = cookieStore.get('tg_user')
    if (tgUserCookie) {
      try {
        const tgUser = JSON.parse(tgUserCookie.value)
        if (tgUser?.id) {
          return tgUser.id.toString()
        }
      } catch (e) {
        console.warn('⚠️ Invalid tg_user cookie:', e)
      }
    }

    // Способ 3: Из query параметров (для разработки)
    // Недоступно в server component, используем только для отладки
  } catch (error) {
    console.warn('⚠️ Error getting user from request:', error)
  }

  return process.env.DEFAULT_USER_ID || 'guest_user_demo_1337'
}

// ✅ Маппер из PostgreSQL в UserData (обновленный)
const mapDbUserToUserData = (dbUser: any): UserData | null => {
  if (!dbUser) return null

  return {
    id: dbUser.id,
    points: typeof dbUser.points === 'bigint' 
      ? Number(dbUser.points) 
      : (dbUser.points || 0),
    energy: typeof dbUser.energy === 'bigint'
      ? Number(dbUser.energy)
      : (dbUser.energy || 1000),
    maxEnergy: typeof dbUser.maxEnergy === 'bigint'
      ? Number(dbUser.maxEnergy)
      : (dbUser.maxEnergy || 1000),
    level: dbUser.level || 1,
    exp: dbUser.exp || 0,
    unclaimedPoints: typeof dbUser.unclaimedPoints === 'bigint'
      ? Number(dbUser.unclaimedPoints)
      : (dbUser.unclaimedPoints || 0),
    passiveRate: dbUser.passiveRate || 0,
    skin: dbUser.skin || 'default',
    vipUntil: dbUser.vipUntil || null,
    totalSpent: dbUser.totalSpent || 0,
    createdAt: dbUser.createdAt || new Date(),
    updatedAt: dbUser.updatedAt || new Date(),
  }
}

// ✅ Маппер из Redis в UserData (обновленный)
const mapRedisUserToUserData = (redisUser: any): UserData | null => {
  if (!redisUser || Object.keys(redisUser).length === 0) return null

  return {
    id: redisUser.id || '',
    points: parseInt(redisUser.points || '0', 10),
    energy: parseInt(redisUser.energy || '1000', 10),
    maxEnergy: parseInt(redisUser.maxEnergy || '1000', 10),
    level: parseInt(redisUser.level || '1', 10),
    exp: parseInt(redisUser.exp || '0', 10),
    unclaimedPoints: parseInt(redisUser.unclaimedPoints || '0', 10),
    passiveRate: parseFloat(redisUser.passiveRate || '0'), // ✅ Исправлено
    skin: redisUser.skin || 'default',
    vipUntil: redisUser.vipUntil ? new Date(redisUser.vipUntil) : null,
    totalSpent: parseFloat(redisUser.totalSpent || '0'),
    createdAt: redisUser.createdAt ? new Date(redisUser.createdAt) : new Date(),
    updatedAt: redisUser.updatedAt ? new Date(redisUser.updatedAt) : new Date(),
  }
}

export default async function ProfilePage() {
  const activeUserId = await getUserIdFromRequest()  // ✅ Асинхронный вызов

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
              energy: 1000,
              maxEnergy: 1000,
              exp: 0,
              skin: 'default',
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
        skin: 'default',
        vipUntil: null,
        totalSpent: 0,
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
    
    // Проверка VIP статуса
    const isVip = userData.vipUntil && new Date(userData.vipUntil) > new Date()
    const vipDaysLeft = isVip 
      ? Math.ceil((new Date(userData.vipUntil!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    // ✅ Проверяем, есть ли нераспределенные очки для отображения
    const hasUnclaimedPoints = userData.unclaimedPoints > 0

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
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${redisAvailable ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-[10px] text-slate-500">
              {redisAvailable
                ? 'Redis online'
                : 'Redis offline (используется PostgreSQL)'}
            </span>
            {isVip && (
              <span className="ml-auto text-[10px] text-yellow-400 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                VIP {vipDaysLeft}д
              </span>
            )}
          </div>
        </header>

        {/* Блок статистики */}
        <div className="relative z-10 flex-1 p-4 space-y-4 overflow-y-auto scrollbar-none">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 space-y-3.5 shadow-inner">
            {/* Скин и статус VIP */}
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-purple-400" /> Скин:
              </span>
              <span className="text-sm font-mono font-black text-purple-400">
                {userData.skin === 'legendary' ? '⭐ Легендарный' : userData.skin || 'Обычный'}
              </span>
            </div>

            {isVip && (
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-yellow-400" /> VIP до:
                </span>
                <span className="text-sm font-mono font-black text-yellow-400">
                  {new Date(userData.vipUntil!).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

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
                <ShieldAlert className="w-4 h-4 text-purple-400" /> RPG Уровень:
              </span>
              <span className="text-sm font-mono font-black text-purple-400">
                {userData.level} LVL
              </span>
            </div>

            {/* Нераспределенные очки с уведомлением */}
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Нераспределенные:
              </span>
              <span className={`text-sm font-mono font-black ${hasUnclaimedPoints ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                {userData.unclaimedPoints.toLocaleString()}
                {hasUnclaimedPoints && ' 🔔'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Пассивный доход:
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

            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Дней в игре:
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

          {/* Траты */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-amber-400" /> Всего потрачено:
              </span>
              <span className="text-sm font-mono font-black text-amber-400">
                ${userData.totalSpent.toFixed(2)}
              </span>
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