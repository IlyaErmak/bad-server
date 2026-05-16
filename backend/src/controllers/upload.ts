import { NextFunction, Request, Response } from 'express'
import { unlinkSync } from 'fs'
import { constants } from 'http2'
import sharp from 'sharp'
import BadRequestError from '../errors/bad-request-error'
import { MIN_FILE_SIZE } from '../middlewares/file'

const removeQuietly = (filePath: string) => {
    try {
        unlinkSync(filePath)
    } catch {
        /* noop */
    }
}

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    // Минимальный размер: режем потенциально мусорные загрузки.
    if (req.file.size < MIN_FILE_SIZE) {
        removeQuietly(req.file.path)
        return next(
            new BadRequestError('Файл слишком маленький, минимум 2 КБ')
        )
    }

    // Подтверждаем по содержимому, что это действительно изображение,
    // а не подделанный mime-type. sharp прочитает заголовок и кинет
    // ошибку, если перед нами не картинка.
    try {
        const meta = await sharp(req.file.path).metadata()
        if (!meta.format || !meta.width || !meta.height) {
            throw new Error('invalid image')
        }
    } catch {
        removeQuietly(req.file.path)
        return next(
            new BadRequestError('Файл не является корректным изображением')
        )
    }

    try {
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
