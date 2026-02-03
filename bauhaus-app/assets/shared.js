export const STORAGE_KEY = "bauhaus-deck-v2";

export const sanitizeText = (value) => value.replace(/\s+/g, " ").trim();

export const stripListPrefix = (line) => line.replace(/^[-*•]\s+/, "").trim();

export const parseBlocks = (text) => {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
};

export const parseTextToSlides = (text) => {
  const blocks = parseBlocks(text);
  if (!blocks.length) {
    return [
      {
        type: "title",
        title: "開始建立你的簡報",
        subtitle: "請先在左側貼上內容",
        body: "",
        bullets: [],
      },
    ];
  }

  const slides = [];
  blocks.forEach((block, index) => {
    const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^[-*•]\s+/.test(line));
    const nonListLines = lines.filter((line) => !/^[-*•]\s+/.test(line));

    if (listLines.length >= 2 || (listLines.length === lines.length && listLines.length > 0)) {
      const titleSource = nonListLines[0] || (index === 0 ? "核心重點" : `重點整理 ${index + 1}`);
      slides.push({
        type: "list",
        title: titleSource.replace(/[:：]$/, ""),
        subtitle: "",
        body: "",
        bullets: listLines.map(stripListPrefix),
      });
      return;
    }

    const title = lines[0] || `重點 ${index + 1}`;
    const body = sanitizeText(lines.slice(1).join(" "));

    if (index === 0) {
      slides.push({
        type: "title",
        title,
        subtitle: body || "",
        body: body || "",
        bullets: [],
      });
    } else {
      slides.push({
        type: "text",
        title,
        subtitle: "",
        body: body || title,
        bullets: [],
      });
    }
  });

  return slides;
};

export const formatSlideNumber = (index) => String(index + 1).padStart(2, "0");

export const ensureDefaultSlides = () => [
  {
    type: "title",
    title: "Welcome to the Future",
    subtitle: "Exploring the intersection of form, function, and modern web technologies.",
    body: "Exploring the intersection of form, function, and modern web technologies.",
    bullets: [],
  },
  {
    type: "list",
    title: "Key Design Principles",
    subtitle: "",
    body: "",
    bullets: ["Form follows function", "Minimalism reduces load", "Primary colors hierarchy"],
  },
  {
    type: "text",
    title: "Technology & Logic",
    subtitle: "",
    body: "Advanced NLP detects structure automatically. We believe tools should empower creativity.",
    bullets: [],
  },
];
