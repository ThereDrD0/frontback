const content = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");
const status = document.getElementById("status");
const enablePushBtn = document.getElementById("enable-push");
const disablePushBtn = document.getElementById("disable-push");
const socket = io();
const storageKey = "pr16_notes";
const vapidPublicKey =
  "BEnFuBo_jaZbUY1kCwAlW2UOD5queXYEy3R_QTb3Vm3FEKBeS4Cx9VuexnA0BNABdY51dp6dstStyNuuR4iSMVo";

function setActiveButton(button) {
  homeBtn.classList.toggle("active", button === "home");
  aboutBtn.classList.toggle("active", button === "about");
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);

    if (!response.ok) {
      throw new Error("load error");
    }

    content.innerHTML = await response.text();

    if (page === "home") {
      initNotes();
    }
  } catch (error) {
    content.innerHTML = "<p>Не удалось загрузить страницу.</p>";
  }
}

function getNotes() {
  return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function saveNotes(notes) {
  localStorage.setItem(storageKey, JSON.stringify(notes));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function renderNotes() {
  const list = document.getElementById("notes-list");

  if (!list) {
    return;
  }

  const notes = getNotes();

  if (notes.length === 0) {
    list.innerHTML = "<li>Заметок пока нет</li>";
    return;
  }

  list.innerHTML = notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
}

function addNote(text) {
  const notes = getNotes();
  notes.push(text);
  saveNotes(notes);
  renderNotes();
  socket.emit("newTask", { text });
}

function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  
  if (!form || !input || form.dataset.ready === "1") {
    renderNotes();
    return;
  }

  form.dataset.ready = "1";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) {
      return;
    }

    addNote(text);
    input.value = "";
  });

  renderNotes();
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function sendSubscription(subscription) {
  await fetch("/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscription)
  });
}

function setPushButtons(isSubscribed) {
  enablePushBtn.hidden = isSubscribed;
  disablePushBtn.hidden = !isSubscribed;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }

  await sendSubscription(subscription);
}

async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  await fetch("/unsubscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });

  await subscription.unsubscribe();
}

async function syncPushButtons() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    enablePushBtn.hidden = true;
    disablePushBtn.hidden = true;
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await sendSubscription(subscription);
  }

  setPushButtons(Boolean(subscription));
}

function updateStatus() {
  status.textContent = navigator.onLine ? "Онлайн" : "Офлайн";
}

homeBtn.addEventListener("click", () => {
  setActiveButton("home");
  loadContent("home");
});

aboutBtn.addEventListener("click", () => {
  setActiveButton("about");
  loadContent("about");
});

window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);

socket.on("taskAdded", (task) => {
  if (!task || task.senderId === socket.id) {
    return;
  }

  showToast(`Новая задача: ${task.text}`);
});

async function startApp() {
  setActiveButton("home");
  updateStatus();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      await syncPushButtons();
    } catch (error) {
      console.error("Service worker error", error);
    }
  } else {
    enablePushBtn.hidden = true;
    disablePushBtn.hidden = true;
  }

  enablePushBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "denied") {
      alert("Уведомления запрещены в браузере.");
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Нужно разрешить уведомления.");
        return;
      }
    }

    try {
      await subscribeToPush();
      setPushButtons(true);
    } catch (error) {
      console.error("Push subscribe error", error);
    }
  });

  disablePushBtn.addEventListener("click", async () => {
    try {
      await unsubscribeFromPush();
      setPushButtons(false);
    } catch (error) {
      console.error("Push unsubscribe error", error);
    }
  });

  await loadContent("home");
}

startApp();
