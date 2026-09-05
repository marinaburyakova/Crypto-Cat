# Crypto-Cat
  markdown
# 🐱 Crypto Clicker

**Crypto Clicker** — это кликер-игра с элементами криптовалюты и Telegram Mini App интеграцией. Игроки кликают по 3D коту, зарабатывают очки, прокачивают уровень и могут покупать энергию за Stars или TON.

---

## 📋 Оглавление

- [Технологии](#-технологии)
- [Структура проекта](#-структура-проекта)
- [Установка и запуск](#-установка-и-запуск)
- [Переменные окружения](#-переменные-окружения)
- [База данных](#-база-данных)
- [API Эндпоинты](#-api-эндпоинты)
- [Игровая механика](#-игровая-механика)
- [Деплой](#-деплой)
- [Команды](#-команды)
- [Лицензия](#-лицензия)

---

## 🚀 Технологии

| Категория | Технологии |
|-----------|------------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS |
| **3D** | Three.js, GLTFLoader |
| **Backend** | Next.js API Routes, Prisma ORM |
| **База данных** | PostgreSQL 17, Redis 7 |
| **Аутентификация** | JWT, bcryptjs |
| **Валидация** | Zod, react-hook-form |
| **Платежи** | TON Connect, Stars |
| **Деплой** | Docker, PM2, Ubuntu |

---

## 📁 Структура проекта
my-crypto-clicker/
├── app/
│ ├── api/
│ │ ├── auth/ # Аутентификация
│ │ │ ├── login/ # POST /api/auth/login
│ │ │ └── register/ # POST /api/auth/register
│ │ ├── clicks/ # GET/POST /api/clicks
│ │ ├── payments/ # Платежи TON/Stars
│ │ └── user/profile/ # GET /api/user/profile
│ ├── login/ # Страница входа
│ ├── profile/ # Страница профиля
│ ├── layout.tsx
│ └── page.tsx # Главная страница (игра)
├── components/
│ ├── game/ # Игровые компоненты
│ │ ├── GameUI.tsx # Главный игровой интерфейс
│ │ ├── game-field.tsx # 3D сцена с котом
│ │ ├── GameHeader.tsx # Шапка с очками
│ │ └── ...
│ ├── profile/ # Компоненты профиля
│ └── ui/ # UI компоненты
├── hooks/
│ ├── useAuth.ts # Аутентификация
│ ├── useGameLogic.ts # Игровая логика
│ └── useTelegram.ts # Telegram WebApp
├── lib/
│ ├── prisma.ts # Prisma клиент
│ ├── redis.ts # Redis клиент
│ └── validation/auth.ts # Zod схемы
├── prisma/
│ └── schema.prisma # Схема БД
├── public/assets/models/ # 3D модели котов
├── docker-compose.yml
├── package.json
└── README.md

text

---

## 🛠 Установка и запуск

### Требования

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 17 (или Docker)
- Redis 7 (или Docker)

### 1️⃣ Клонирование репозитория

```bash
git clone https://github.com/your-username/crypto-clicker.git
cd crypto-clicker
2️⃣ Установка зависимостей
bash
npm install
3️⃣ Запуск инфраструктуры (Docker)
bash
# Запустить PostgreSQL и Redis
docker-compose up -d

# Проверить, что контейнеры запущены
docker ps
4️⃣ Настройка переменных окружения
bash
# Создать файл .env
cp .env.example .env

# Отредактировать .env
nano .env
5️⃣ Настройка базы данных
bash
# Применить схему Prisma
npx prisma db push

# Сгенерировать Prisma Client
npx prisma generate
6️⃣ Запуск приложения
bash
# Режим разработки
npm run dev

# Сборка и запуск
npm run build
npm start
Приложение будет доступно по адресу: http://localhost:3000

🔐 Переменные окружения
env
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_clicker"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# TON (для платежей)
TON_API_KEY="your-ton-api-key"
TON_WALLET_ADDRESS="your-wallet-address"
TON_NETWORK="testnet"  # или mainnet

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
🗄 База данных
Схема (Prisma)
prisma
model User {
  id              String         @id
  login           String         @unique
  password        String?
  points          BigInt         @default(0)
  energy          Int            @default(1000)
  maxEnergy       Int            @default(1000)
  level           Int            @default(1)
  exp             Int            @default(0)
  vipUntil        DateTime?
  skin            String?        @default("default")
  transactions    Transaction[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
Команды Prisma
bash
# Открыть Prisma Studio
npx prisma studio

# Создать миграцию
npx prisma migrate dev --name migration_name

# Применить миграции
npx prisma migrate deploy

# Сбросить базу (локально)
npx prisma db push --force-reset
🌐 API Эндпоинты
Аутентификация
Метод	Эндпоинт	Описание
POST	/api/auth/register	Регистрация нового пользователя
POST	/api/auth/login	Вход в аккаунт
Игра
Метод	Эндпоинт	Описание
GET	/api/clicks?userId={id}	Получение данных игрока
POST	/api/clicks	Отправка кликов
Платежи
Метод	Эндпоинт	Описание
POST	/api/payments/energy/buy-stars	Покупка энергии за Stars
POST	/api/payments/energy/buy-ton	Покупка энергии за TON
GET	/api/payments/check-status	Проверка статуса платежа
Профиль
Метод	Эндпоинт	Описание
GET	/api/user/profile?userId={id}	Получение профиля пользователя
🎮 Игровая механика
Основные механики
Механика	Описание
Клики	Нажми на кота → +10 очков
Энергия	Ограничивает количество кликов
Комбо	Серия кликов → множитель очков
Уровень	Повышается каждые 500 очков
Достижения	Супер-кот (50 очков), Легендарный кот (1000 очков)
3D Коты
Кот	Условие	Модель
Обычный	0–49 очков	cat.glb
Супер-кот	50–999 очков	cat_superhero.glb
Легендарный	1000+ очков	cat_legendary.glb
Энергия
Максимум: 1000 единиц

Восстановление: Автоматически (опционально)

Покупка: За Stars или TON

🐳 Docker
Запуск контейнеров
bash
# Запустить все сервисы
docker-compose up -d

# Остановить все сервисы
docker-compose down

# Посмотреть логи
docker-compose logs -f

# Перезапустить конкретный сервис
docker-compose restart postgres
Dockerfile (приложение)
dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
🌍 Деплой
На сервер (Ubuntu)
bash
# 1. Установить Node.js и Docker
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs docker docker-compose

# 2. Склонировать проект
git clone https://github.com/your-username/crypto-clicker.git
cd crypto-clicker

# 3. Настроить переменные окружения
nano .env

# 4. Запустить через PM2
npm install -g pm2
npm install
npm run build
pm2 start npm --name "crypto-clicker" -- start
pm2 save
pm2 startup
Конфиг PM2 (ecosystem.config.js)
js
module.exports = {
  apps: [{
    name: 'crypto-clicker',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M'
  }]
}
📋 Команды
bash
# Разработка
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка проекта
npm start            # Запуск собранного проекта

# База данных
npx prisma studio    # Открыть Prisma Studio
npx prisma generate  # Сгенерировать Prisma Client
npx prisma db push   # Применить схему (без миграций)

# Докер
docker-compose up -d # Запуск контейнеров
docker-compose down  # Остановка контейнеров

# Линтинг
npm run lint         # Проверка кода
npm run type-check   # Проверка типов
🤝 Вклад в проект
Форкните репозиторий

Создайте ветку: git checkout -b feature/amazing-feature

Сделайте коммит: git commit -m 'Add amazing feature'

Пуш: git push origin feature/amazing-feature

Создайте Pull Request

📄 Лицензия
MIT License — используйте как хотите 🚀

📞 Контакты
Разработчик: [Your Name]

Telegram: [@your_telegram]

Email: your@email.com

🐱 Удачи в игре! И помни: каждый клик приближает к легендарному коту! 👑