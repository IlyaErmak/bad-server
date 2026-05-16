# Проектная работа "WebLarek. Плохой сервер", спринт 17

## О работе

* Репозиторий: https://github.com/IlyaErmak/bad-server
* Автор: Илья Ермаков, когорта 43, курс «Веб-разработчик»
* Деплой: не публиковался (только локальный запуск)

## Что было исправлено

Аудит безопасности по чек-листу:

| Уязвимость | Где исправлено |
| --- | --- |
| **XSS** в комментариях/адресах заказа | `src/controllers/order.ts` + `src/utils/sanitize.ts` (sanitize-html) |
| **CSRF** | `src/middlewares/csrf.ts` — double-submit cookie (`GET /auth/csrf-token` + проверка заголовка `X-CSRF-Token`) |
| **NoSQL-инъекции** | `express-mongo-sanitize` глобально + строгая проверка типа `status` в `controllers/order.ts` |
| **Переполнение буфера** | `express.json({ limit: '10kb' })`, ограничения длины строк в Joi-валидациях |
| **ReDoS** | новый безопасный `phoneRegExp`, экранирование пользовательского ввода через `utils/escapeRegExp.ts` перед `new RegExp` |
| **DDoS** | `express-rate-limit` (`middlewares/rateLimiter.ts`) — общий + усиленный лимит на `/auth/*` |
| **Path Traversal** | `middlewares/serverStatic.ts`, `utils/movingFile.ts`, генерация имени файла из `crypto.randomBytes` в `middlewares/file.ts` |
| **Файлы загрузки** | минимум 2 КБ, максимум 10 МБ, проверка реального изображения через `sharp` |
| **Контроль доступа** | `roleGuardMiddleware(Role.Admin)` на `/customers/*` и `/order/all` |
| **CORS** | явный `origin` из `ORIGIN_ALLOW`, `credentials: true`, белый список заголовков |
| **npm audit** | `npm audit fix --force` на бэке и фронте + `.npmrc` с надёжным реестром |
| **Helmet** | базовые security-заголовки на каждом ответе |

## Подготовка к работе

1. Склонировать репозиторий
2. Запустить docker
```bash
docker compose up -d
```
3. Наполнить базу данных — см. [.dump/README.md](.dump/README.md)
4. Перейти по адресу http://localhost/ — должны быть продукты
5. Авторизация: http://localhost/login/
6. Админка: http://localhost/admin/
