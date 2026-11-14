/* Buchmechanik: Blättern durch die aus den Geschichten berechneten Seiten.
   Es sind höchstens zwei statische Seiten und ein 3D-Blatt im DOM. */
(() => {
  "use strict";
  const MIN_BOOK_PAGES = 35;
  const { collectBlocks, paginate, renderPage } = window.BookPagination;
  const blocks = collectBlocks(window.BOOK_STORIES);
  const book = document.querySelector("#book");
  const stage = document.querySelector("#book-stage");
  const pages = document.querySelector("#pages");
  const left = document.querySelector("#left-page");
  const right = document.querySelector("#right-page");
  const cover = document.querySelector("#cover");
  const openButton = document.querySelector("#open-book");
  const closeButton = document.querySelector("#close-book");
  const navigation = document.querySelector("#navigation");
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const status = document.querySelector("#page-status");
  const announcement = document.querySelector("#announcement");
  const mobile = matchMedia("(max-width: 700px), (max-height: 500px) and (pointer: coarse)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let pageContents = [];
  let readingPosition = null;
  let reflowFrame = 0;
  let index = 0;
  let isOpen = false;
  let busy = false;
  let activeAnimation = null;
  let pointerStart = null;

  function totalPages() {
    return Math.max(MIN_BOOK_PAGES, pageContents.length);
  }

  function fillPage(element, pageIndex) {
    const fragments = pageIndex < totalPages() ? (pageContents[pageIndex] ?? []) : undefined;
    renderPage(element, fragments, pageIndex);
  }

  function spreadStart(pageIndex) {
    return Math.floor(pageIndex / step()) * step();
  }

  function reflow() {
    reflowFrame = 0;
    if (busy) {
      activeAnimation?.();
      scheduleReflow();
      return;
    }

    // Bei extrem großer Schrift bleibt ein vollständiger Textzeilenumbruch möglich.
    book.style.minHeight = "";
    let result = paginate(blocks, book);
    while (!result.pages) {
      book.style.minHeight = `${Math.ceil(book.offsetHeight + result.extraHeight * 2 + 2)}px`;
      result = paginate(blocks, book);
    }

    pageContents = result.pages;
    const anchor = readingPosition;
    const pageIndex = anchor ? pageContents.findIndex(fragments => fragments.some(fragment =>
      fragment.block.storyId === anchor.block.storyId && fragment.block.order === anchor.block.order &&
      fragment.start <= anchor.start && fragment.end > anchor.start
    )) : index;
    index = spreadStart(Math.min(Math.max(0, pageIndex), totalPages() - 1));
    render();
  }

  function scheduleReflow() {
    pointerStart = null;
    if (!reflowFrame) reflowFrame = requestAnimationFrame(reflow);
  }

  function step() { return mobile.matches ? 1 : 2; }
  function lastIndex() { return spreadStart(totalPages() - 1); }

  function updateControls() {
    book.setAttribute("aria-busy", String(busy));
    book.setAttribute("aria-label", isOpen ? status.textContent : "Geschlossenes Buch");
    book.dataset.state = busy ? "animating" : isOpen ? "open" : "closed";
    openButton.disabled = busy;
    closeButton.disabled = busy;
    previous.disabled = busy || index === 0;
    next.disabled = busy || index >= lastIndex();
    previous.setAttribute("aria-label", mobile.matches ? "Vorherige Seite" : "Vorherige Seiten");
    next.setAttribute("aria-label", mobile.matches ? "Nächste Seite" : "Nächste Seiten");
  }

  function render() {
    fillPage(left, index);
    if (!mobile.matches) fillPage(right, index + 1);
    else right.replaceChildren();
    const total = totalPages();
    const end = Math.min(index + step(), total);
    const label = end === index + 1 ? `Seite ${index + 1} von ${total}` : `Seiten ${index + 1}–${end} von ${total}`;
    status.textContent = label;
    updateControls();
  }

  /* Events + Zeitgrenze: Auch bei Tabwechsel, Resize oder abgebrochener
     CSS-Animation wird der Zustand zuverlässig fertiggestellt. */
  function waitForAnimation(element) {
    if (reducedMotion.matches) return Promise.resolve();
    return new Promise(resolve => {
      let timer;
      const finish = () => {
        clearTimeout(timer);
        element.removeEventListener("animationend", onEnd);
        element.removeEventListener("animationcancel", onEnd);
        activeAnimation = null;
        resolve();
      };
      const onEnd = event => { if (event.target === element) finish(); };
      activeAnimation = finish;
      element.addEventListener("animationend", onEnd);
      element.addEventListener("animationcancel", onEnd);
      const duration = parseFloat(getComputedStyle(book).getPropertyValue("--turn-duration"));
      timer = setTimeout(finish, Number.isFinite(duration) ? duration + 200 : 1100);
    });
  }

  async function openBook() {
    if (busy || isOpen) return;
    busy = true;
    isOpen = true;
    book.classList.add("is-cover-turning");
    pages.hidden = false;
    updateControls();
    book.classList.remove("is-closed");
    cover.classList.add("is-opening");
    await waitForAnimation(cover);
    cover.hidden = true;
    cover.classList.remove("is-opening");
    book.classList.remove("is-cover-turning");
    openButton.hidden = true;
    navigation.hidden = false;
    closeButton.hidden = false;
    busy = false;
    updateControls();
    announcement.textContent = `Buch geöffnet. ${status.textContent}.`;
    (next.disabled ? previous.disabled ? closeButton : previous : next).focus({ preventScroll: true });
  }

  async function closeBook() {
    if (busy || !isOpen) return;
    busy = true;
    book.classList.add("is-cover-turning");
    updateControls();
    cover.hidden = false;
    cover.classList.add("is-closing");
    book.classList.add("is-closed");
    await waitForAnimation(cover);
    cover.classList.remove("is-closing");
    isOpen = false;
    busy = false;
    pages.hidden = true;
    book.classList.remove("is-cover-turning");
    navigation.hidden = true;
    closeButton.hidden = true;
    openButton.hidden = false;
    render();
    announcement.textContent = "Buch geschlossen.";
    openButton.focus({ preventScroll: true });
  }

  async function turn(direction) {
    if (!isOpen || busy) return;
    const target = index + direction * step();
    if (target < 0 || target > lastIndex()) return;
    busy = true;
    updateControls();
    const sheet = document.createElement("div");
    sheet.className = `turning-sheet ${direction > 0 ? "is-forward" : "is-backward"}`;
    sheet.setAttribute("aria-hidden", "true");
    const front = document.createElement("div");
    const back = document.createElement("div");
    front.className = `page sheet-face ${direction > 0 ? "page--right" : "page--left"}`;
    back.className = `page sheet-face sheet-back ${direction > 0 ? "page--left" : "page--right"}`;
    if (mobile.matches) {
      fillPage(front, index);
      fillPage(back, target);
      fillPage(left, target);
    } else if (direction > 0) {
      fillPage(front, index + 1);
      fillPage(back, target);
      fillPage(right, target + 1);
    } else {
      fillPage(front, index);
      fillPage(back, target + 1);
      fillPage(left, target);
    }
    sheet.append(front, back);
    book.append(sheet);
    await waitForAnimation(sheet);
    sheet.remove();
    readingPosition = pageContents[target]?.[0] ?? null;
    index = spreadStart(target);
    busy = false;
    render();
    announcement.textContent = `${status.textContent}.`;
  }

  openButton.addEventListener("click", openBook);
  closeButton.addEventListener("click", closeBook);
  previous.addEventListener("click", () => turn(-1));
  next.addEventListener("click", () => turn(1));
  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!isOpen) openBook(); else turn(1);
    } else if (event.key === "ArrowLeft" && isOpen) {
      event.preventDefault(); turn(-1);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault(); closeBook();
    }
  });

  stage.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || !event.isPrimary || busy || !isOpen || !mobile.matches) return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointerup", event => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) turn(dx < 0 ? 1 : -1);
  });
  stage.addEventListener("pointercancel", () => { pointerStart = null; });
  stage.addEventListener("lostpointercapture", () => { pointerStart = null; });
  window.addEventListener("resize", scheduleReflow);
  mobile.addEventListener("change", scheduleReflow);
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) activeAnimation?.(); });

  const fontMeasurement = document.createElement("span");
  fontMeasurement.className = "font-measurement";
  fontMeasurement.setAttribute("aria-hidden", "true");
  document.body.append(fontMeasurement);
  const layoutObserver = new ResizeObserver(scheduleReflow);
  layoutObserver.observe(fontMeasurement);
  layoutObserver.observe(stage, { box: "border-box" });
  document.fonts?.addEventListener("loadingdone", scheduleReflow);
  reflow();
})();
