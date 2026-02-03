import { STORAGE_KEY, ensureDefaultSlides, formatSlideNumber } from "./shared.js";

const state = {
  slides: [],
  activeIndex: 0,
};

const elements = {
  slidesList: document.getElementById("slides-list"),
  slideType: document.getElementById("slide-type"),
  headlineInput: document.getElementById("headline-input"),
  subheadlineInput: document.getElementById("subheadline-input"),
  bodyInput: document.getElementById("body-input"),
  bulletsInput: document.getElementById("bullets-input"),
  subheadlineGroup: document.getElementById("subheadline-group"),
  bodyGroup: document.getElementById("body-group"),
  bulletsGroup: document.getElementById("bullets-group"),
  previewTitle: document.getElementById("preview-title"),
  previewBody: document.getElementById("preview-body"),
  previewList: document.getElementById("preview-list"),
  previewSlideLabel: document.getElementById("preview-slide-label"),
  previewYear: document.getElementById("preview-year"),
  paginationText: document.getElementById("pagination-text"),
  deckStatus: document.getElementById("deck-status"),
};

const loadDeck = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.slides && parsed.slides.length) {
      state.slides = parsed.slides;
      return;
    }
  }
  state.slides = ensureDefaultSlides();
};

const saveDeck = () => {
  const payload = {
    slides: state.slides,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  elements.deckStatus.textContent = "Deck saved locally";
};

const updatePagination = () => {
  const totalLabel = String(state.slides.length).padStart(2, "0");
  elements.paginationText.innerHTML = `<span class="accent">${formatSlideNumber(state.activeIndex)}</span> / ${totalLabel}`;
};

const updateFormVisibility = (type) => {
  elements.subheadlineGroup.classList.toggle("hidden", type !== "title");
  elements.bodyGroup.classList.toggle("hidden", type === "list");
  elements.bulletsGroup.classList.toggle("hidden", type !== "list");
};

const renderPreview = () => {
  const slide = state.slides[state.activeIndex];
  elements.previewSlideLabel.textContent = `SLIDE ${formatSlideNumber(state.activeIndex)}`;
  elements.previewYear.textContent = new Date().getFullYear();
  elements.previewTitle.textContent = slide.title || "Untitled";
  elements.previewBody.textContent = slide.subtitle || slide.body || "";

  elements.previewBody.classList.toggle("hidden", slide.type === "list");
  elements.previewList.classList.toggle("hidden", slide.type !== "list");

  elements.previewList.innerHTML = "";
  if (slide.type === "list") {
    slide.bullets.forEach((bullet) => {
      const item = document.createElement("li");
      item.textContent = bullet;
      elements.previewList.appendChild(item);
    });
  }
};

const renderSlidesList = () => {
  elements.slidesList.innerHTML = "";
  state.slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === state.activeIndex ? "active" : "";
    button.innerHTML = `<div>Slide ${formatSlideNumber(index)}</div><strong>${slide.title || "Untitled"}</strong>`;
    button.addEventListener("click", () => {
      state.activeIndex = index;
      syncForm();
      renderAll();
    });
    elements.slidesList.appendChild(button);
  });
};

const syncForm = () => {
  const slide = state.slides[state.activeIndex];
  elements.slideType.value = slide.type;
  elements.headlineInput.value = slide.title || "";
  elements.subheadlineInput.value = slide.subtitle || "";
  elements.bodyInput.value = slide.body || "";
  elements.bulletsInput.value = (slide.bullets || []).join("\n");
  updateFormVisibility(slide.type);
};

const updateSlideFromForm = () => {
  const slide = state.slides[state.activeIndex];
  slide.type = elements.slideType.value;
  slide.title = elements.headlineInput.value.trim();
  slide.subtitle = elements.subheadlineInput.value.trim();
  slide.body = elements.bodyInput.value.trim();
  slide.bullets = elements.bulletsInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  renderAll();
};

const renderAll = () => {
  renderPreview();
  renderSlidesList();
  updatePagination();
};

document.getElementById("nav-prev").addEventListener("click", () => {
  state.activeIndex = (state.activeIndex - 1 + state.slides.length) % state.slides.length;
  syncForm();
  renderAll();
});

document.getElementById("nav-next").addEventListener("click", () => {
  state.activeIndex = (state.activeIndex + 1) % state.slides.length;
  syncForm();
  renderAll();
});

document.getElementById("save-deck").addEventListener("click", saveDeck);

elements.slideType.addEventListener("change", updateSlideFromForm);
[elements.headlineInput, elements.subheadlineInput, elements.bodyInput, elements.bulletsInput].forEach((input) => {
  input.addEventListener("input", updateSlideFromForm);
});

loadDeck();
syncForm();
renderAll();
