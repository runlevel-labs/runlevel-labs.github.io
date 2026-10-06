"use strict";

const fs = require("node:fs");
const path = require("node:path");

const dataPath = path.resolve(__dirname, "..", "data", "ai-history.json");
const requiredFields = [
  "id",
  "date",
  "title",
  "category",
  "summary",
  "sourceName",
  "sourceUrl",
  "status",
  "featured",
];
const categories = new Set([
  "Forschung",
  "Modelle",
  "Open Source",
  "Werkzeuge",
  "Robotik",
  "Gesellschaft und Regulierung",
]);
const statuses = new Set(["reviewed", "draft"]);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) {
    return false;
  }

  const [year, month = "01", day = "01"] = value.split("-");
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() + 1 === Number(month) &&
    parsed.getUTCDate() === Number(day)
  );
}

function isValidSourceUrl(value) {
  if (value === "") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function validateEntry(entry, index, seenIds) {
  const label = `Eintrag ${index + 1}`;
  const errors = [];

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return [`${label}: muss ein Objekt sein.`];
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(entry, field)) {
      errors.push(`${label}: Pflichtfeld "${field}" fehlt.`);
    }
  }

  const textFields = ["id", "date", "title", "category", "summary", "sourceName"];
  for (const field of textFields) {
    if (typeof entry[field] !== "string" || entry[field].trim() === "") {
      errors.push(`${label}: "${field}" muss ein nicht leerer Text sein.`);
    }
  }

  if (typeof entry.id === "string" && entry.id.trim() !== "") {
    if (seenIds.has(entry.id)) {
      errors.push(`${label}: ID "${entry.id}" ist doppelt vorhanden.`);
    }
    seenIds.add(entry.id);
  }

  if (!isValidDate(entry.date)) {
    errors.push(`${label}: Datum "${entry.date}" ist ungültig.`);
  }

  if (!categories.has(entry.category)) {
    errors.push(`${label}: Kategorie "${entry.category}" ist nicht erlaubt.`);
  }

  if (!statuses.has(entry.status)) {
    errors.push(`${label}: Status "${entry.status}" ist nicht erlaubt.`);
  }

  if (typeof entry.featured !== "boolean") {
    errors.push(`${label}: "featured" muss true oder false sein.`);
  }

  if (entry.status === "draft" && entry.featured === true) {
    errors.push(`${label}: Entwürfe dürfen nicht hervorgehoben werden.`);
  }

  if (!isValidSourceUrl(entry.sourceUrl)) {
    errors.push(`${label}: Quellen-URL muss leer oder eine gültige HTTPS-URL sein.`);
  }

  return errors;
}

function main() {
  let data;

  try {
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (error) {
    console.error(`FEHLER: JSON konnte nicht gelesen werden: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(data)) {
    console.error("FEHLER: Die JSON-Hauptebene muss ein Array sein.");
    process.exitCode = 1;
    return;
  }

  const seenIds = new Set();
  const errors = data.flatMap((entry, index) => validateEntry(entry, index, seenIds));

  if (errors.length > 0) {
    console.error(`Datenprüfung fehlgeschlagen (${errors.length} Fehler):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const reviewed = data.filter((entry) => entry.status === "reviewed").length;
  const drafts = data.filter((entry) => entry.status === "draft").length;
  const featured = data.filter(
    (entry) => entry.status === "reviewed" && entry.featured,
  ).length;

  console.log("Datenprüfung erfolgreich.");
  console.log(`Einträge: ${data.length}`);
  console.log(`Geprüft: ${reviewed}`);
  console.log(`Entwürfe: ${drafts}`);
  console.log(`Hervorgehoben: ${featured}`);
}

main();
