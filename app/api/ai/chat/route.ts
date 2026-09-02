// app/api/ai/chat/route.ts
import { NextResponse } from 'next/server'
import { gigachatEngine } from '@/lib/gigachat'

interface ChatRequest {
  userId: string
  message: string
  history?: Array<{ role: string; content: string }>
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, message, history = [] }: ChatRequest = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          response: 'Мяу! Напиши что-нибудь, я тебя слушаю! 🐱',
          emotion: 'idle',
        },
        { status: 400 },
      )
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          response: 'Мяу! Я потерял твою личность! Кто ты? 🐾',
          emotion: 'idle',
        },
        { status: 400 },
      )
    }

    console.log(`📨 Chat request from user: ${userId}`)
    console.log(
      `💬 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    )

    const hasCredentials =
      process.env.GIGACHAT_CREDENTIALS ||
      (process.env.GIGACHAT_CLIENT_ID && process.env.GIGACHAT_CLIENT_SECRET)

    if (!hasCredentials) {
      console.error('❌ GigaChat credentials missing')
      return NextResponse.json({
        response: `Мяу! Я в режиме офлайн, но слышал: "${message}" 🐱\n\n💡 Для работы AI добавьте GIGACHAT_CREDENTIALS в .env файл`,
        emotion: 'idle',
      })
    }

    try {
      console.log('🤖 Calling GigaChatEngine...')

      const petResponse = await gigachatEngine.interactWithPet(message, history)

      console.log(`✅ AI response: ${petResponse.text.substring(0, 100)}...`)
      console.log(`😊 Emotion: ${petResponse.emotion}`)

      return NextResponse.json({
        response: petResponse.text,
        emotion: petResponse.emotion,
      })
    } catch (engineError) {
      console.error('❌ GigaChatEngine error:', engineError)

      return NextResponse.json({
        response:
          'Мяу! Что-то пошло не так, но я все равно рад тебя видеть! 🌟 Попробуй еще раз!',
        emotion: 'idle',
      })
    }
  } catch (error) {
    console.error('💥 Chat route error:', error)

    const status = error instanceof SyntaxError ? 400 : 500
    const message =
      error instanceof Error ? error.message : 'Неизвестная ошибка'

    return NextResponse.json(
      {
        response: `Мяу! Произошла ошибка: ${message}. Попробуй ещё раз! 😿`,
        emotion: 'sad',
      },
      { status },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  )
}
