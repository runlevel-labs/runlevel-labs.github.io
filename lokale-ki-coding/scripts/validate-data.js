"use strict";

const fs = require("node:fs");
const path = require("node:path");

function validateData(data) {
  const errors = [];
  const seenIds = new Set();
  const allowedCases = new Set(["Code-Chat", "Refactoring", "Repo-Fragen", "Tests", "Agenten"]);
  const text = (value, label) => {
    if (typeof value !== "string" || !value.trim()) errors.push(label + ": Text fehlt.");
  };
  const date = (value, label) => {
    const parsed = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T00:00:00Z") : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) errors.push(label + ": Datum ungültig.");
  };
  const url = (value, label) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:" || !parsed.hostname) throw new Error();
    } catch {
      errors.push(label + ": HTTPS-URL fehlt oder ist ungültig.");
    }
  };
  const strings = (values, label) => {
    if (!Array.isArray(values) || values.length === 0) errors.push(label + ": Liste fehlt.");
    else values.forEach((value, index) => text(value, label + "[" + index + "]"));
  };

  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.models) || data.models.length === 0) {
    throw new Error("schemaVersion 1 und eine nicht leere Modellliste sind erforderlich.");
  }
  date(data.updatedAt, "updatedAt");
  data.models.forEach((model, index) => {
    const label = "Modell " + (index + 1);
    if (!model || typeof model !== "object") {
      errors.push(label + ": Objekt fehlt.");
      return;
    }
    for (const field of ["id", "name", "provider", "profile", "parameters", "quantization", "strengths", "repo", "agents", "toolNote", "ollamaCommand", "offline", "verdict", "limitations"]) text(model[field], label + "." + field);
    if (typeof model.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(model.id) || seenIds.has(model.id)) errors.push(label + ": ID ungültig oder doppelt.");
    seenIds.add(model.id);
    for (const field of ["weightsGb", "ram", "vram", "context", "note"]) text(model.memory?.[field], label + ".memory." + field);
    for (const field of ["languages", "useCases", "tools"]) strings(model[field], label + "." + field);
    if (Array.isArray(model.useCases) && model.useCases.some(value => !allowedCases.has(value))) errors.push(label + ": Unbekanntes Einsatzgebiet.");
    text(model.license?.name, label + ".license.name");
    text(model.license?.note, label + ".license.note");
    url(model.license?.url, label + ".license.url");
    date(model.checkedAt, label + ".checkedAt");
    if (model.checkedAt > data.updatedAt) errors.push(label + ": Prüfung liegt nach dem Datenstand.");
    if (!Array.isArray(model.sources) || model.sources.length < 2) errors.push(label + ": Modell- und Paketquellen erforderlich.");
    else model.sources.forEach(source => {
      text(source?.label, label + ".source.label");
      url(source?.url, label + ".source.url");
    });
    if (typeof model.ollamaCommand !== "string" || !/^ollama run (?:[a-z0-9][a-z0-9.:-]*|hf\.co\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+)$/.test(model.ollamaCommand) || model.ollamaCommand.includes("cloud")) errors.push(label + ": Lokaler Ollama-Befehl ungültig.");
  });
  if (errors.length) throw new Error(errors.join("\n"));
  return data;
}

function readData() {
  return validateData(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/models.json"), "utf8")));
}

module.exports = { validateData, readData };

if (require.main === module) {
  try {
    const data = readData();
    console.log("Datenprüfung erfolgreich: " + data.models.length + " Modelle, Stand " + data.updatedAt + ".");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
