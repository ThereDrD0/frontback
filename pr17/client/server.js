const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const PORT = process.env.PORT || 3001;
const vapidKeys = {
  publicKey: "BEnFuBo_jaZbUY1kCwAlW2UOD5queXYEy3R_QTb3Vm3FEKBeS4Cx9VuexnA0BNABdY51dp6dstStyNuuR4iSMVo",
  privateKey: "LYgYPUZbXL5hxqwrLwq8m3MoOMzBR1_TboYiLk81k-M"
};

webPush.setVapidDetails(
  "mailto:student@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "./")));

let subscriptions = [];
const reminders = new Map();

async function sendPush(payload) {
  if (subscriptions.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) => webPush.sendNotification(subscription, payload))
  );

  subscriptions = subscriptions.filter((subscription, index) => {
    const result = results[index];

    if (result.status === "fulfilled") {
      return true;
    }

    const statusCode = result.reason && result.reason.statusCode;
    return statusCode !== 404 && statusCode !== 410;
  });
}

function scheduleReminder(id, text, delay, title = "Напоминание") {
  const oldReminder = reminders.get(id);

  if (oldReminder && oldReminder.timeoutId) {
    clearTimeout(oldReminder.timeoutId);
  }

  const timeoutId = setTimeout(async () => {
    const payload = JSON.stringify({
      title,
      body: text,
      reminderId: id
    });

    await sendPush(payload);
    reminders.set(id, {
      timeoutId: null,
      text,
      reminderTime: Date.now()
    });
  }, delay);

  reminders.set(id, {
    timeoutId,
    text,
    reminderTime: Date.now() + delay
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Клиент подключён:", socket.id);

  socket.on("newTask", async (task) => {
    if (!task || typeof task.text !== "string" || !task.text.trim()) {
      return;
    }

    const message = {
      text: task.text.trim(),
      timestamp: Date.now(),
      senderId: socket.id
    };

    io.emit("taskAdded", message);

    const payload = JSON.stringify({
      title: "Новая задача",
      body: message.text
    });

    await sendPush(payload);
  });

  socket.on("newReminder", (reminder) => {
    if (!reminder || typeof reminder.text !== "string") {
      return;
    }

    const id = Number(reminder.id);
    const reminderTime = Number(reminder.reminderTime);
    const text = reminder.text.trim();
    const delay = reminderTime - Date.now();

    if (!id || !text || delay <= 0) {
      return;
    }

    scheduleReminder(id, text, delay);
  });

  socket.on("disconnect", () => {
    console.log("Клиент отключён:", socket.id);
  });
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ message: "Некорректная подписка" });
    return;
  }

  const exists = subscriptions.some((item) => item.endpoint === subscription.endpoint);

  if (!exists) {
    subscriptions.push(subscription);
  }

  res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};

  subscriptions = subscriptions.filter((subscription) => subscription.endpoint !== endpoint);
  res.status(200).json({ message: "Подписка удалена" });
});

app.post("/snooze", (req, res) => {
  const reminderId = Number(req.query.reminderId);
  const reminder = reminders.get(reminderId);

  if (!reminderId || !reminder) {
    res.status(404).json({ error: "Напоминание не найдено" });
    return;
  }

  scheduleReminder(reminderId, reminder.text, 5 * 60 * 1000, "Отложенное напоминание");
  res.status(200).json({ message: "Напоминание отложено на 5 минут" });
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
