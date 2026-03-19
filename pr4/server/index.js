const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));

let products = [
  { id: nanoid(6), name: "Ноутбук", category: "Электроника", description: "Игровой ноутбук", price: 100000, stock: 5 },
  { id: nanoid(6), name: "Мышь", category: "Периферия", description: "Беспроводная мышь", price: 2000, stock: 50 },
  { id: nanoid(6), name: "Клавиатура", category: "Периферия", description: "Механическая клавиатура", price: 5000, stock: 20 },
  { id: nanoid(6), name: "Монитор", category: "Электроника", description: "Монитор 27 дюймов", price: 25000, stock: 10 },
  { id: nanoid(6), name: "Кабель HDMI", category: "Аксессуары", description: "Кабель 2 метра", price: 500, stock: 100 },
  { id: nanoid(6), name: "Наушники", category: "Аудио", description: "Гарнитура с микрофоном", price: 4000, stock: 30 },
  { id: nanoid(6), name: "Коврик для мыши", category: "Аксессуары", description: "Большой коврик", price: 1000, stock: 40 },
  { id: nanoid(6), name: "Веб-камера", category: "Периферия", description: "Веб-камера 1080p", price: 3000, stock: 15 },
  { id: nanoid(6), name: "Флешка", category: "Память", description: "Флешка 64 ГБ", price: 800, stock: 80 },
  { id: nanoid(6), name: "Внешний HDD", category: "Память", description: "Диск 1 ТБ", price: 4500, stock: 25 }
];

function findProductOr404(id, res) {
  const product = products.find((item) => item.id === id);

  if (!product) {
    res.status(404).json({ error: "Товар не найден" });
    return null;
  }

  return product;
}

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);

  if (!product) {
    return;
  }

  res.json(product);
});

app.post("/api/products", (req, res) => {
  const newProduct = { id: nanoid(6), ...req.body };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);

  if (!product) {
    return;
  }

  Object.assign(product, req.body);
  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const exists = products.some((item) => item.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  products = products.filter((item) => item.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
});
