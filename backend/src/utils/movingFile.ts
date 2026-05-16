import { existsSync, mkdirSync, rename } from 'fs'
import { basename, resolve, sep } from 'path'

/**
 * Перемещает файл из временной директории в постоянную.
 * Имя файла нормализуем через basename (отбрасываем любые `..` и поддиректории).
 * Дополнительно проверяем, что итоговый путь не выходит за пределы каталога-приёмника.
 */
function movingFile(imagePath: string, from: string, to: string) {
    const fileName = basename(imagePath)
    const fromRoot = resolve(from)
    const toRoot = resolve(to)
    const imagePathTemp = resolve(fromRoot, fileName)
    const imagePathPermanent = resolve(toRoot, fileName)

    if (
        !imagePathTemp.startsWith(fromRoot + sep) ||
        !imagePathPermanent.startsWith(toRoot + sep)
    ) {
        throw new Error('Недопустимый путь к файлу')
    }

    mkdirSync(toRoot, { recursive: true })
    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла')
    }

    rename(imagePathTemp, imagePathPermanent, (err) => {
        if (err) {
            throw new Error('Ошибка при сохранении файла')
        }
    })
}

export default movingFile
