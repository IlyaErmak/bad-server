import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'

/**
 * CSRF-защита по схеме double-submit cookie.
 *
 *  - GET /api/auth/csrf-token выдаёт токен: кладёт его в cookie `csrfToken`
 *    (доступ из JS не требуется, поэтому ставим httpOnly=false, чтобы
 *    клиент мог прочитать и отправить в заголовке) и возвращает в JSON.
 *  - На каждый изменяющий запрос (POST/PUT/PATCH/DELETE) проверяем,
 *    что заголовок X-CSRF-Token совпадает со значением из cookie.
 */

const COOKIE_NAME = '_csrf'
const HEADER_NAME = 'x-csrf-token'

const generateToken = () => crypto.randomBytes(32).toString('hex')

export const issueCsrfToken = (req: Request, res: Response) => {
    const existing = req.cookies?.[COOKIE_NAME]
    const csrfToken = existing && typeof existing === 'string' ? existing : generateToken()

    res.cookie(COOKIE_NAME, csrfToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
    })
    res.json({ csrfToken })
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const csrfProtection = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (SAFE_METHODS.has(req.method)) {
        return next()
    }

    const cookieToken = req.cookies?.[COOKIE_NAME]
    const headerToken = req.header(HEADER_NAME)

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return next(new ForbiddenError('Невалидный CSRF-токен'))
    }

    return next()
}

export default csrfProtection
