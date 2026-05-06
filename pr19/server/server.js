const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});

app.use(express.json());

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      age INTEGER NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function validateUser(data, partial = false) {
  const firstName = data.first_name;
  const lastName = data.last_name;
  const age = data.age === undefined ? undefined : Number(data.age);

  if (!partial || firstName !== undefined) {
    if (typeof firstName !== "string" || !firstName.trim()) {
      return "Имя обязательно";
    }
  }

  if (!partial || lastName !== undefined) {
    if (typeof lastName !== "string" || !lastName.trim()) {
      return "Фамилия обязательна";
    }
  }

  if (!partial || data.age !== undefined) {
    if (!Number.isInteger(age) || age < 0) {
      return "Возраст должен быть целым числом";
    }
  }

  return null;
}

app.post(
  "/api/users",
  asyncRoute(async (req, res) => {
    const error = validateUser(req.body);

    if (error) {
      res.status(400).json({ error });
      return;
    }

    const now = Date.now();
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, age, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.body.first_name.trim(), req.body.last_name.trim(), Number(req.body.age), now, now]
    );

    res.status(201).json(result.rows[0]);
  })
);

app.get(
  "/api/users",
  asyncRoute(async (req, res) => {
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows);
  })
);

app.get(
  "/api/users/:id",
  asyncRoute(async (req, res) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json(result.rows[0]);
  })
);

app.patch(
  "/api/users/:id",
  asyncRoute(async (req, res) => {
    const error = validateUser(req.body, true);

    if (error) {
      res.status(400).json({ error });
      return;
    }

    const current = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);

    if (current.rows.length === 0) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    const user = current.rows[0];
    const firstName = req.body.first_name === undefined ? user.first_name : req.body.first_name.trim();
    const lastName = req.body.last_name === undefined ? user.last_name : req.body.last_name.trim();
    const age = req.body.age === undefined ? user.age : Number(req.body.age);

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, age = $3, updated_at = $4
       WHERE id = $5
       RETURNING *`,
      [firstName, lastName, age, Date.now(), req.params.id]
    );

    res.json(result.rows[0]);
  })
);

app.delete(
  "/api/users/:id",
  asyncRoute(async (req, res) => {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json(result.rows[0]);
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Ошибка сервера" });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Не удалось подключиться к PostgreSQL", error);
    process.exit(1);
  });
