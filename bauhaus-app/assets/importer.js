import { STORAGE_KEY, parseTextToSlides } from "./shared.js";

const sourceText = document.getElementById("source-text");
const charCount = document.getElementById("char-count");
const cursorPosition = document.getElementById("cursor-position");
const previewCount = document.getElementById("preview-count");
const previewGrid = document.getElementById("preview-grid");
const statusMessage = document.getElementById("status-message");

const updateCounts = () => {
  const value = sourceText.value;
  charCount.textContent = `${value.length} characters`;
  const cursor = sourceText.selectionStart || 0;
  const textBefore = value.slice(0, cursor);
  const lines = textBefore.split("\n");
  const lineNumber = lines.length;
  const columnNumber = lines[lines.length - 1].length + 1;
  cursorPosition.textContent = `Ln ${lineNumber}, Col ${columnNumber}`;
};

const renderPreview = (slides) => {
  previewGrid.innerHTML = "";
  slides.forEach((slide, index) => {
    const card = document.createElement("article");
    card.className = "slide-card";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = String(index + 1).padStart(2, "0");

    const body = document.createElement("div");
    body.className = "card-body";

    const label = document.createElement("span");
    label.textContent = slide.type === "list" ? "KEY POINTS" : slide.type === "title" ? "INTRODUCTION" : "CONTENT";
    label.style.fontSize = "10px";
    label.style.fontWeight = "700";
    label.style.letterSpacing = "0.3em";

    const title = document.createElement("h4");
    title.textContent = slide.title || "Untitled";

    body.appendChild(label);
    body.appendChild(title);

    if (slide.type === "list") {
      const list = document.createElement("ul");
      slide.bullets.slice(0, 3).forEach((bullet) => {
        const item = document.createElement("li");
        item.textContent = bullet;
        list.appendChild(item);
      });
      body.appendChild(list);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = slide.subtitle || slide.body || "";
      paragraph.style.fontSize = "12px";
      paragraph.style.color = "#555";
      body.appendChild(paragraph);
    }

    card.appendChild(badge);
    card.appendChild(body);
    previewGrid.appendChild(card);
  });
};

const refreshPreview = () => {
  const slides = parseTextToSlides(sourceText.value);
  previewCount.textContent = `Processing ${slides.length} slides based on content`;
  renderPreview(slides);
};

const saveDeck = () => {
  const slides = parseTextToSlides(sourceText.value);
  const deck = {
    slides,
    sourceText: sourceText.value,
    prompt: document.getElementById("prompt-input").value,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
  statusMessage.textContent = `已產生 ${slides.length} 張投影片，可以進入編輯器。`;
};

const handleGenerate = () => {
  saveDeck();
  window.location.href = "editor.html";
};

const clearText = () => {
  sourceText.value = "";
  updateCounts();
  refreshPreview();
  statusMessage.textContent = "內容已清空，請重新貼上文本。";
};

["input", "click", "keyup"].forEach((eventName) => {
  sourceText.addEventListener(eventName, () => {
    updateCounts();
    refreshPreview();
  });
});

document.getElementById("generate-deck").addEventListener("click", handleGenerate);
document.getElementById("clear-text").addEventListener("click", clearText);
document.getElementById("open-editor").addEventListener("click", () => {
  window.location.href = "editor.html";
});

document.getElementById("save-deck").addEventListener("click", saveDeck);

updateCounts();
refreshPreview();
