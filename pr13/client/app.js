const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const status = document.getElementById("status");
const storageKey = "pr13_tasks";

function getTasks() {
  return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function renderTasks() {
  const tasks = getTasks();

  if (tasks.length === 0) {
    list.innerHTML = "<li>Список пуст</li>";
    return;
  }

  list.innerHTML = tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text) {
    return;
  }

  const tasks = getTasks();
  tasks.push(text);
  saveTasks(tasks);
  input.value = "";
  renderTasks();
});

function updateStatus() {
  status.textContent = navigator.onLine ? "Онлайн" : "Офлайн";
}

window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);

renderTasks();
updateStatus();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.error("Service worker error", error);
    }
  });
}
