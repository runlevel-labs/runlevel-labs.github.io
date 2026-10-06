"use strict";

const CATEGORIES = [
  "Alle",
  "Forschung",
  "Modelle",
  "Open Source",
  "Werkzeuge",
  "Robotik",
  "Gesellschaft und Regulierung",
];

const state = {
  entries: [],
  category: "Alle",
  query: "",
};

const elements = {
  filters: document.querySelector("#category-filters"),
  search: document.querySelector("#search-input"),
  latest: document.querySelector("#latest-list"),
  timeline: document.querySelector("#timeline-list"),
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  resultStatus: document.querySelector("#result-status"),
};

function normalizeDate(date) {
  const parts = String(date).split("-").map(Number);
  const [year, month = 1, day = 1] = parts;
  return Date.UTC(year, month - 1, day);
}

function formatDate(date) {
  const parts = String(date).split("-");

  if (parts.length === 1) {
    return parts[0];
  }

  const parsed = new Date(normalizeDate(date));
  const options =
    parts.length === 2
      ? { year: "numeric", month: "long", timeZone: "UTC" }
      : { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };

  return new Intl.DateTimeFormat("de-DE", options).format(parsed);
}

function isValidEntry(entry) {
  const requiredTextFields = [
    "id",
    "date",
    "title",
    "category",
    "summary",
    "sourceName",
    "status",
  ];

  return (
    entry &&
    requiredTextFields.every(
      (field) => typeof entry[field] === "string" && entry[field].trim() !== "",
    ) &&
    CATEGORIES.includes(entry.category) &&
    ["reviewed", "draft"].includes(entry.status) &&
    typeof entry.featured === "boolean"
  );
}

function createFilters() {
  const fragment = document.createDocumentFragment();

  CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === state.category));
    fragment.append(button);
  });

  elements.filters.replaceChildren(fragment);
}

function getStatus(entry) {
  if (entry.status === "draft") {
    return { label: "Entwurf / noch nicht geprüft", modifier: "draft" };
  }

  if (entry.featured) {
    return { label: "Aktuell", modifier: "current" };
  }

  return { label: "Historisch", modifier: "historic" };
}

function createSource(entry) {
  const source = document.createElement("span");
  source.className = "source";
  source.append("Quelle: ");

  if (entry.sourceUrl) {
    const link = document.createElement("a");
    link.href = entry.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = entry.sourceName;
    link.setAttribute("aria-label", `${entry.sourceName} (öffnet in neuem Tab)`);
    source.append(link);
  } else {
    source.append(entry.sourceName);
  }

  return source;
}

function createStatus(entry) {
  const status = getStatus(entry);
  const badge = document.createElement("span");
  badge.className = `status status--${status.modifier}`;
  badge.textContent = status.label;
  return badge;
}

function createLatestCard(entry) {
  const article = document.createElement("article");
  article.className = "card latest-card";

  const date = document.createElement("time");
  date.className = "card__date";
  date.dateTime = entry.date;
  date.textContent = formatDate(entry.date);

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const summary = document.createElement("p");
  summary.className = "card__summary";
  summary.textContent = entry.summary;

  const meta = document.createElement("div");
  meta.className = "card__meta";

  const category = document.createElement("span");
  category.className = "category";
  category.textContent = entry.category === "Robotik" ? "🤖 KI-Robotik" : entry.category;

  meta.append(category, createSource(entry), createStatus(entry));
  article.append(date, title, summary, meta);
  return article;
}

function createTimelineItem(entry) {
  const item = document.createElement("li");
  item.className = "timeline__item";

  const marker = document.createElement("span");
  marker.className = "timeline__marker";
  marker.setAttribute("aria-hidden", "true");

  const date = document.createElement("time");
  date.className = "timeline__date";
  date.dateTime = entry.date;
  date.textContent = formatDate(entry.date);

  const article = document.createElement("article");
  article.className = `card timeline-card${entry.status === "draft" ? " card--draft" : ""}`;

  const content = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = entry.title;
  const summary = document.createElement("p");
  summary.className = "card__summary";
  summary.textContent = entry.summary;
  content.append(title, summary);

  const aside = document.createElement("div");
  aside.className = "timeline-card__aside";
  const category = document.createElement("span");
  category.className = "category";
  category.textContent = entry.category === "Robotik" ? "🤖 KI-Robotik" : entry.category;
  aside.append(category, createSource(entry), createStatus(entry));

  article.append(content, aside);
  item.append(marker, date, article);
  return item;
}

function createEmptyState(message) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function getFilteredEntries() {
  const normalizedQuery = state.query.trim().toLocaleLowerCase("de-DE");

  return state.entries.filter((entry) => {
    const matchesCategory =
      state.category === "Alle" || entry.category === state.category;
    const searchableText = `${entry.title} ${entry.date} ${entry.summary}`.toLocaleLowerCase(
      "de-DE",
    );
    return matchesCategory && searchableText.includes(normalizedQuery);
  });
}

function render() {
  const filtered = getFilteredEntries();
  const latest = filtered
    .filter((entry) => entry.featured && entry.status === "reviewed")
    .sort((a, b) => normalizeDate(b.date) - normalizeDate(a.date));
  const timeline = [...filtered].sort(
    (a, b) => normalizeDate(a.date) - normalizeDate(b.date),
  );

  elements.latest.replaceChildren(
    ...(latest.length
      ? latest.map(createLatestCard)
      : [createEmptyState("Keine geprüften aktuellen Entwicklungen gefunden.")]),
  );

  elements.timeline.replaceChildren(
    ...(timeline.length
      ? timeline.map(createTimelineItem)
      : [createEmptyState("Keine passenden Timeline-Einträge gefunden.")]),
  );

  const categoryText =
    state.category === "Alle" ? "allen Kategorien" : `„${state.category}“`;
  elements.resultStatus.textContent = `${filtered.length} ${
    filtered.length === 1 ? "Eintrag" : "Einträge"
  } in ${categoryText}.`;
}

function loadTimeline() {
  try {
    const data = window.GinaChronikData;

    if (!Array.isArray(data) || !data.every(isValidEntry)) {
      throw new Error("Ungültiges Datenformat");
    }

    state.entries = data;
    elements.loading.hidden = true;
    render();
  } catch (error) {
    console.error("Timeline-Daten konnten nicht geladen werden:", error);
    elements.loading.hidden = true;
    elements.error.hidden = false;
    elements.resultStatus.textContent = "Daten konnten nicht geladen werden.";
  }
}

elements.filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");

  if (!button) {
    return;
  }

  state.category = button.dataset.category;
  elements.filters.querySelectorAll("button").forEach((filterButton) => {
    filterButton.setAttribute(
      "aria-pressed",
      String(filterButton === button),
    );
  });
  render();
});

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

createFilters();
loadTimeline();
