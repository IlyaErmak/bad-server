import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import { issueCsrfToken } from './middlewares/csrf'
import errorHandler from './middlewares/error-handler'
import { apiLimiter } from './middlewares/rateLimiter'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000, ORIGIN_ALLOW = 'http://localhost:5173' } = process.env
const app = express()

// Приложение всегда работает за обратным прокси (nginx), поэтому доверяем
// его X-Forwarded-* заголовкам — иначе rate limiter будет видеть всех
// клиентов с одного IP.
app.set('trust proxy', 1)

// Базовые security-заголовки. CSP оставляем дефолтным, чтобы не ломать SPA.
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
)

app.use(cookieParser())

// CORS с явным origin и credentials — иначе браузер не отправит refresh-cookie.
const corsOptions = {
    origin: ORIGIN_ALLOW,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(serveStatic(path.join(__dirname, 'public')))

// Жёсткий лимит на тело запроса: страховка от переполнения памяти.
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))

// Глобально вырезаем из тела/параметров ключи, начинающиеся с `$` или
// содержащие `.` — защита от NoSQL-инъекций через query string.
app.use(mongoSanitize())

// Rate limiting (защита от DDoS/брутфорса).
app.use(apiLimiter)

// Эндпоинт получения CSRF-токена. Должен быть до защищённых маршрутов
// и без CSRF-валидации, так как сам её и инициирует.
app.get('/auth/csrf-token', issueCsrfToken)

app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
