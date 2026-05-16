import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

/**
 * Безопасная отдача статики:
 *   - резолвим запрашиваемый путь относительно baseDir
 *   - проверяем, что итоговый путь не выходит за пределы baseDir
 *     (защита от Path Traversal вида `/../../etc/passwd`)
 */
export default function serveStatic(baseDir: string) {
    const root = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        // Декодируем %2e%2e и подобное, чтобы проверить нормализованный путь
        let decodedPath: string
        try {
            decodedPath = decodeURIComponent(req.path)
        } catch {
            return next()
        }

        // path.normalize избавляется от `..` сегментов
        const filePath = path.resolve(root, `.${path.normalize(decodedPath)}`)

        // Запрашиваемый файл должен лежать внутри baseDir
        if (!filePath.startsWith(root + path.sep) && filePath !== root) {
            return next()
        }

        return fs.access(filePath, fs.constants.F_OK, (accessErr) => {
            if (accessErr) {
                return next()
            }
            return fs.stat(filePath, (statErr, stats) => {
                if (statErr || !stats.isFile()) {
                    return next()
                }
                return res.sendFile(filePath, (sendErr) => {
                    if (sendErr) next(sendErr)
                })
            })
        })
    }
}
