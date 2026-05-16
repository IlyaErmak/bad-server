import { Request } from 'express'
import rateLimit from 'express-rate-limit'

const toInt = (value: string | undefined, fallback: number) => {
    const n = Number.parseInt(value ?? '', 10)
    return Number.isFinite(n) && n > 0 ? n : fallback
}

const RATE_LIMITED = process.env.RATE_LIMITED !== 'false'
const POINTS = toInt(process.env.RATE_LIMIT_POINTS, 20)
const DURATION_SEC = toInt(process.env.RATE_LIMIT_DURATION, 60)

/**
 * Глобальный rate-limit. Защищает от DDoS и брутфорса.
 * Параметры берутся из env, чтобы их можно было менять между окружениями.
 *
 *   RATE_LIMITED=false  — выключить лимит (для dev/CI без нагрузочных тестов)
 *   RATE_LIMIT_POINTS   — сколько запросов с одного IP можно делать в окне
 *   RATE_LIMIT_DURATION — длина окна в секундах
 *
 * Эндпоинт /auth/csrf-token исключён, потому что его вызывает каждый
 * mutating-запрос перед собственно действием.
 */
const isCsrfRequest = (req: Request) => req.path === '/auth/csrf-token'

export const apiLimiter = rateLimit({
    windowMs: DURATION_SEC * 1000,
    limit: POINTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => !RATE_LIMITED || isCsrfRequest(req),
    message: { message: 'Слишком много запросов, попробуйте позже' },
})

// Более строгий лимит на чувствительные точки (login, register, refresh).
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !RATE_LIMITED,
    message: { message: 'Слишком много попыток авторизации, попробуйте позже' },
})

export default apiLimiter
