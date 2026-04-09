const content = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");
const status = document.getElementById("status");
const storageKey = "pr15_notes";

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

function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const list = document.getElementById("notes-list");

  function renderNotes() {
    const notes = getNotes();

    if (notes.length === 0) {
      list.innerHTML = "<li>Заметок пока нет</li>";
      return;
    }

    list.innerHTML = notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) {
      return;
    }

    const notes = getNotes();
    notes.push(text);
    saveNotes(notes);
    input.value = "";
    renderNotes();
  });

  renderNotes();
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

async function startApp() {
  setActiveButton("home");
  updateStatus();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
    } catch (error) {
      console.error("Service worker error", error);
    }
  }

  loadContent("home");
}

startApp();
