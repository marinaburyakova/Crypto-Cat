// lib/rate-limit.ts
export class RateLimiter {
  private windowMs: number
  private max: number
  private requests: Map<string, { count: number; resetTime: number }>

  constructor({ windowMs, max }: { windowMs: number; max: number }) {
    this.windowMs = windowMs
    this.max = max
    this.requests = new Map()
  }

  check(key: string): boolean {
    const now = Date.now()
    const record = this.requests.get(key)

    if (!record) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (record.count >= this.max) {
      return false
    }

    record.count++
    return true
  }

  // Очистка старых записей (опционально)
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.requests) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}