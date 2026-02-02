# UC Training Platform

Платформа для учёта заведений, сотрудников и сертификатов с админкой, регистрацией по ссылкам и импортом результатов обучения.

## Быстрый старт (Docker)

1) Скопируйте env:

```sh
cp server/.env.example server/.env
```

2) Заполните минимум:
- `AUTH_JWT_SECRET`
- `ADMIN_BOOTSTRAP_KEY`
- `IIN_ENCRYPTION_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

3) Запуск:

```sh
docker compose up --build
```

Открыть:
- фронт: `http://localhost:8080`
- админка: `/admin` (логин `/admin/login`)
- пользователь: `/login`

## Локально (без Docker)

1) Postgres:

```sh
docker compose up -d postgres
```

2) API:

```sh
cd server
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

3) Фронт:

```sh
npm install
npm run dev
```

## Авторизация

- Админ создаётся через `/admin/login` с `ADMIN_BOOTSTRAP_KEY`.
- Пользователь создаёт пароль при регистрации по ссылке.
- Токен хранится в httpOnly cookie.

## Страницы

- `/admin` — админ‑панель
- `/register/:token` — регистрация сотрудника
- `/login` — вход пользователя
- `/account` — кабинет пользователя
- `/offer`, `/policy`, `/faq`, `/contacts` — заглушки

## Переменные окружения (server/.env)

Обязательно:
- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `ADMIN_BOOTSTRAP_KEY`
- `IIN_ENCRYPTION_KEY`

SMTP:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`

Дополнительно:
- `GETCOURSE_URL`
- `COOKIE_SECURE`
- `CORS_ORIGIN`
