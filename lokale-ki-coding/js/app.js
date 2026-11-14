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
    details.append(element("h4", model.startLabel || "Start mit installiertem Ollama"));
    const command = element("pre");
    command.append(element("code", model.startCommand || model.ollamaCommand));
    details.append(command);
    paragraph(details, "Lizenz", model.license.name + ": " + model.license.note);
    paragraph(details, "Offline & vertraulicher Code", model.offline);
    paragraph(details, "Grenzen im Alltag", model.limitations);

    const sources = element("p", "", "links");
    for (const source of model.sources) sources.append(link(source.label, source.url));
    sources.append(link("Modelllizenz", model.license.url));
    if (model.addedAt) {
      paragraph(details, "In unserer Auswahl seit", formatDate(model.addedAt));
    }
    details.append(sources, element("p", "Quellen geprüft: " + formatDate(model.checkedAt), "coding-checked"));
    article.append(details);
    return article;
  }

  try {
    const data = window.LocalCodingModels;
    if (data?.schemaVersion !== 1 || !Array.isArray(data.models) || data.models.length === 0) {
      throw new Error("Modelldaten fehlen oder haben ein unbekanntes Format.");
    }
    const search = document.querySelector("#model-search");
    const sort = document.querySelector("#model-sort");
    const clear = document.querySelector("#clear-search");
    const collator = new Intl.Collator("de", { sensitivity: "base", numeric: true });
    const newest = (a, b) => (b.addedAt || "").localeCompare(a.addedAt || "") || collator.compare(a.name, b.name);
    const normalize = text => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("de").replace(/ß/g, "ss");
    const cards = new Map(data.models.map(model => [model.id, card(model)]));
    const latest = data.models.filter(model => model.addedAt).sort(newest)[0];
    if (latest) cards.get(latest.id).classList.add("coding-latest");
    const searchTexts = new Map(data.models.map(model => [model.id,
      normalize([model.name, model.provider, model.profile, model.strengths, ...model.useCases].join(" "))
    ]));

    function render() {
      const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      const models = data.models.filter(model => terms.every(term => searchTexts.get(model.id).includes(term)));
      models.sort(sort.value === "name" ? (a, b) => collator.compare(a.name, b.name) : newest);
      list.replaceChildren(...models.map(model => cards.get(model.id)));
      document.querySelector("#model-results").textContent = models.length + " von " + data.models.length + " Modellen";
      document.querySelector("#model-empty").hidden = models.length > 0;
      clear.disabled = search.value.length === 0;
    }

    const recent = data.models.filter(model => model.addedAt).sort(newest).slice(0, 5);
    const recentList = document.querySelector("#recent-models");
    for (const model of recent) {
      const item = element("li");
      const jump = element("a", "", "coding-recent-link");
      jump.href = "#" + model.id;
      const date = element("time", "Aufgenommen am " + formatDate(model.addedAt));
      date.dateTime = model.addedAt;
      jump.append(date, element("strong", model.name), element("span", model.provider));
      jump.addEventListener("click", () => {
        // Restore the target even when the archive search currently excludes it.
        if (!document.getElementById(model.id)) {
          search.value = "";
          render();
        }
        const target = cards.get(model.id);
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      });
      item.append(jump);
      recentList.append(item);
    }
    search.addEventListener("input", render);
    sort.addEventListener("change", render);
    clear.addEventListener("click", () => {
      search.value = "";
      render();
      search.focus();
    });
    render();
    document.querySelector("#model-browser").hidden = false;
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
