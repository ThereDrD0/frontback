const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));

let products =[
  { id: nanoid(6), name: "Ноутбук", category: "Электроника", description: "Игровой", price: 100000, stock: 5 },
  { id: nanoid(6), name: "Мышь", category: "Периферия", description: "Беспроводная", price: 2000, stock: 50 },
  { id: nanoid(6), name: "Клавиатура", category: "Периферия", description: "Механическая", price: 5000, stock: 20 },
  { id: nanoid(6), name: "Монитор", category: "Электроника", description: "27 дюймов", price: 25000, stock: 10 },
  { id: nanoid(6), name: "Кабель HDMI", category: "Аксессуары", description: "2 метра", price: 500, stock: 100 },
  { id: nanoid(6), name: "Наушники", category: "Аудио", description: "С микрофоном", price: 4000, stock: 30 },
  { id: nanoid(6), name: "Коврик", category: "Аксессуары", description: "Большой", price: 1000, stock: 40 },
  { id: nanoid(6), name: "Веб-камера", category: "Периферия", description: "1080p", price: 3000, stock: 15 },
  { id: nanoid(6), name: "Флешка", category: "Память", description: "64 ГБ", price: 800, stock: 80 },
  { id: nanoid(6), name: "Внешний ЖД", category: "Память", description: "1 ТБ", price: 4500, stock: 25 }
];

app.get("/api/products", (req, res) => res.json(products));

app.post("/api/products", (req, res) => {
  const newProduct = { id: nanoid(6), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).send();
  Object.assign(product, req.body);
  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(3000);