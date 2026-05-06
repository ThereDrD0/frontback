# Практическая работа 19

Простое API для пользователей с PostgreSQL.

## Запуск

```bash
cd server
npm install
npm start
```

По умолчанию сервер использует настройки PostgreSQL из переменных окружения `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

Можно передать одну строку подключения:

```bash
$env:DATABASE_URL="postgres://postgres:password@localhost:5432/mydatabase"
npm start
```

Адрес сервера: `http://localhost:3000`

## Маршруты

- `POST /api/users` - создать пользователя;
- `GET /api/users` - получить список;
- `GET /api/users/:id` - получить одного пользователя;
- `PATCH /api/users/:id` - обновить пользователя;
- `DELETE /api/users/:id` - удалить пользователя.

Пример тела запроса:

```json
{
  "first_name": "Иван",
  "last_name": "Петров",
  "age": 20
}
```
