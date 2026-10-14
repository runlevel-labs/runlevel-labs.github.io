"use strict";

(() => {
  const list = document.querySelector("#model-list");
  const state = document.querySelector("#load-state");
  const dateFormat = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC" });
  const formatDate = value => dateFormat.format(new Date(value + "T00:00:00Z"));

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function link(label, url) {
    const node = element("a", label);
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error("Ungültige Quellen-URL.");
    node.href = parsed.href;
    return node;
  }

  function paragraph(details, heading, text) {
    details.append(element("h4", heading), element("p", text));
  }

  function card(model) {
    const article = element("article", "", "card coding-model");
    article.id = model.id;
    const title = element("h3", model.name);
    title.id = model.id + "-title";
    article.setAttribute("aria-labelledby", title.id);
    article.append(element("span", model.profile, "coding-profile"), title,
      element("p", model.provider, "coding-provider"));

    const specs = element("dl", "", "coding-specs");
    for (const [label, value] of [
      ["Modellgröße", model.parameters],
      ["Sinnvolle Quantisierung", model.quantization],
      ["RAM · CPU / Unified Memory", model.memory.ram],
      ["VRAM · vollständig auf GPU", model.memory.vram],
    ]) {
      const group = element("div");
      group.append(element("dt", label), element("dd", value));
      specs.append(group);
    }
    article.append(specs);

    const cases = element("div", "", "coding-use-cases");
    cases.setAttribute("aria-label", "Einsatzgebiete");
    for (const useCase of model.useCases) cases.append(element("span", useCase, "mini-tag"));
    article.append(cases, element("p", model.verdict));

    const details = element("details", "", "coding-details");
    details.append(element("summary", "Coding, Tools & Lizenz im Detail"));
    paragraph(details, "Typische Coding-Stärken", model.strengths);
    paragraph(details, "Sprachen · typische Startpunkte", model.languages.join(" · "));
    paragraph(details, "Repository-Fragen", model.repo);
    paragraph(details, "Agenten", model.agents);
    paragraph(details, "Speicher & Kontext", model.memory.weightsGb + ". " + model.memory.context + ". " + model.memory.note);
    paragraph(details, "Lokale Tools", model.tools.join(" · ") + ". " + model.toolNote);
    details.append(element("h4", "Start mit installiertem Ollama"));
    const command = element("pre");
    command.append(element("code", model.ollamaCommand));
    details.append(command);
    paragraph(details, "Lizenz", model.license.name + ": " + model.license.note);
    paragraph(details, "Offline & vertraulicher Code", model.offline);
    paragraph(details, "Grenzen im Alltag", model.limitations);

    const sources = element("p", "", "links");
    for (const source of model.sources) sources.append(link(source.label, source.url));
    sources.append(link("Modelllizenz", model.license.url));
    details.append(sources, element("p", "Quellen geprüft: " + formatDate(model.checkedAt), "coding-checked"));
    article.append(details);
    return article;
  }

  try {
    const data = window.LocalCodingModels;
    if (data?.schemaVersion !== 1 || !Array.isArray(data.models) || data.models.length === 0) {
      throw new Error("Modelldaten fehlen oder haben ein unbekanntes Format.");
    }
    list.replaceChildren(...data.models.map(card));
    document.querySelector("#data-date").textContent = data.models.length + " Modelle · Stand " + formatDate(data.updatedAt);
    state.hidden = true;
  } catch (error) {
    state.textContent = "Die Modellauswahl konnte nicht geladen werden. Bitte die Seite neu laden; die Angaben sind auch über die Modelldatei verfügbar.";
    state.append(document.createTextNode(" "), Object.assign(element("a", "Modelldatei öffnen"), { href: "data/models.json" }));
    state.setAttribute("role", "alert");
    console.error(error);
  }
  document.querySelector("#year").textContent = new Date().getFullYear();
})();
