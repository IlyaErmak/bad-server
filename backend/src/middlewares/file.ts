import crypto from 'crypto'
import { Request, Express } from 'express'
import { mkdirSync } from 'fs'
import mime from 'mime-types'
import multer, { FileFilterCallback } from 'multer'
import { extname, join } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

// Минимум 2 KB, максимум 10 MB — соответствует требованиям ТЗ
export const MIN_FILE_SIZE = 2 * 1024
export const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIME = new Set([
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
])

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg'])

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const destinationPath = join(
            __dirname,
            process.env.UPLOAD_PATH_TEMP
                ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                : '../public'
        )
        mkdirSync(destinationPath, { recursive: true })
        cb(null, destinationPath)
    },

    /**
     * Не используем оригинальное имя файла, чтобы не было возможности
     * подставить путь типа `../../etc/passwd` или перезаписать чужой файл.
     * Генерируем имя из криптослучайных байт + расширение, выведенное
     * из mime-type (а не из имени, которому нельзя доверять).
     */
    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const random = crypto.randomBytes(16).toString('hex')
        const mimeExt = mime.extension(file.mimetype)
        const ext = mimeExt
            ? `.${mimeExt}`
            : extname(file.originalname).toLowerCase()
        cb(null, `${random}${ext}`)
    },
})

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(null, false)
    }
    const ext = extname(file.originalname).toLowerCase()
    if (ext && !ALLOWED_EXT.has(ext)) {
        return cb(null, false)
    }
    return cb(null, true)
}

export default multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
})
