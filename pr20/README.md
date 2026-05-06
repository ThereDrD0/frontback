# Практическая работа 20

Простое API для пользователей с MongoDB.

## Запуск

```bash
cd server
npm install
npm start
```

По умолчанию используется адрес `mongodb://127.0.0.1:27017/pr20`.

Можно передать свой адрес:

```bash
$env:MONGO_URL="mongodb://YourMongoAdmin:1234@localhost:27017/admin"
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
