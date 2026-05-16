import sanitizeHtml from 'sanitize-html'

/**
 * Жёсткая санитизация для пользовательских строк, которые потом могут
 * быть отрендерены в HTML (например, комментарий заказа в админке).
 * Удаляет любые теги и атрибуты — оставляет только текст.
 */
export const sanitizeText = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str = typeof value === 'string' ? value : String(value)
    return sanitizeHtml(str, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard',
    })
}

export default sanitizeText
