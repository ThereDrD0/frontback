const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/pr20";

app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    age: { type: Number, required: true },
    created_at: { type: Number, required: true },
    updated_at: { type: Number, required: true }
  },
  {
    versionKey: false
  }
);

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    value: { type: Number, default: 0 }
  },
  {
    versionKey: false
  }
);

const User = mongoose.model("User", userSchema);
const Counter = mongoose.model("Counter", counterSchema);

async function getNextId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "users" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  return counter.value;
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

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
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
    const user = await User.create({
      id: await getNextId(),
      first_name: req.body.first_name.trim(),
      last_name: req.body.last_name.trim(),
      age: Number(req.body.age),
      created_at: now,
      updated_at: now
    });

    res.status(201).json(user);
  })
);

app.get(
  "/api/users",
  asyncRoute(async (req, res) => {
    const users = await User.find().sort({ id: 1 });
    res.json(users);
  })
);

app.get(
  "/api/users/:id",
  asyncRoute(async (req, res) => {
    const user = await User.findOne({ id: Number(req.params.id) });

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json(user);
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

    const update = {
      updated_at: Date.now()
    };

    if (req.body.first_name !== undefined) {
      update.first_name = req.body.first_name.trim();
    }

    if (req.body.last_name !== undefined) {
      update.last_name = req.body.last_name.trim();
    }

    if (req.body.age !== undefined) {
      update.age = Number(req.body.age);
    }

    const user = await User.findOneAndUpdate({ id: Number(req.params.id) }, update, { new: true });

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json(user);
  })
);

app.delete(
  "/api/users/:id",
  asyncRoute(async (req, res) => {
    const user = await User.findOneAndDelete({ id: Number(req.params.id) });

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json(user);
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Ошибка сервера" });
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Не удалось подключиться к MongoDB", error);
    process.exit(1);
  });
