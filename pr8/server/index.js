const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;
const jwtSecret = "simple_secret_key";

let nextUserId = 1;
let nextProductId = 1;

const users = [];
const products = [];

app.use(express.json());

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function findProductById(id) {
  return products.find((product) => product.id === id);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing or invalid authorization header" });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    res.status(401).json({ error: "invalid or expired token" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "email, first_name, last_name and password are required" });
  }

  const normalizedEmail = String(email).trim();

  if (findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ error: "user already exists" });
  }

  const user = {
    id: String(nextUserId++),
    email: normalizedEmail,
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    password: await bcrypt.hash(String(password), 10)
  };

  users.push(user);

  res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = findUserByEmail(String(email).trim());

  if (!user) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const isValid = await bcrypt.compare(String(password), user.password);

  if (!isValid) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    jwtSecret,
    { expiresIn: "15m" }
  );

  res.json({ accessToken });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((item) => item.id === req.user.sub);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  });
});

app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "title, category, description and price are required" });
  }

  const product = {
    id: String(nextProductId++),
    title: String(title).trim(),
    category: String(category).trim(),
    description: String(description).trim(),
    price: Number(price)
  };

  products.push(product);
  res.status(201).json(product);
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  res.json(product);
});

app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  const { title, category, description, price } = req.body;

  if (title !== undefined) {
    product.title = String(title).trim();
  }

  if (category !== undefined) {
    product.category = String(category).trim();
  }

  if (description !== undefined) {
    product.description = String(description).trim();
  }

  if (price !== undefined) {
    product.price = Number(price);
  }

  res.json(product);
});

app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const index = products.findIndex((product) => product.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "product not found" });
  }

  products.splice(index, 1);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "route not found" });
});

app.listen(port, () => {
  console.log(`Server started: http://localhost:${port}`);
});
