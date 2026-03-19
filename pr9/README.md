# Практическая работа 9

Сервер доработан refresh-токенами и маршрутом `POST /api/auth/refresh`.

## Запуск

```bash
cd server
npm install
npm start
```

Сервер: `http://localhost:3000`

Для обновления токенов refresh-токен передаётся в заголовке `x-refresh-token`.
