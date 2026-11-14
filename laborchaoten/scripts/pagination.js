(() => {
  "use strict";

  const pictureIcon = '<svg viewBox="0 0 64 52" aria-hidden="true"><rect x="2" y="2" width="60" height="48" rx="3"/><circle cx="47" cy="15" r="6"/><path d="m3 46 20-23 18 19 9-10 12 14"/></svg>';
  const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("de") : null;

  function collectBlocks(stories) {
    const blocks = [];
    for (const story of stories) {
      const first = blocks.length;
      const add = (type, value) => blocks.push({ type, value, order: blocks.length - first, storyId: story.id });
      if (story.image || story.placeholder) {
        add("picture", { image: story.image, imageAlt: story.imageAlt, tone: story.tone });
      }
      if (story.title?.trim()) add("title", story.title.trim());
      const paragraphs = Array.isArray(story.text) ? story.text : [story.text];
      for (const item of paragraphs) {
        if (typeof item === "string" && item.trim()) add("text", item.trim());
        else if (item?.image) add("picture", { ...item, tone: story.tone });
      }
      if (story.closing?.trim()) add("closing", story.closing.trim());
      if (story.closingImage?.image) add("picture", { ...story.closingImage, atEnd: true });
      if (blocks[first]) blocks[first].startsStory = true;
    }
    return blocks;
  }

  function createContent() {
    const content = document.createElement("div");
    content.className = "page-content";
    return content;
  }

  function createNumber(pageIndex) {
    const number = document.createElement("span");
    number.className = "page-number";
    number.textContent = String(pageIndex + 1);
    number.setAttribute("aria-label", `Seite ${pageIndex + 1}`);
    return number;
  }

  function createPicture({ image, imageAlt, tone, atEnd }) {
    const figure = document.createElement("figure");
    figure.className = "picture-card";
    figure.dataset.tone = tone || "blue";
    if (image) {
      const img = document.createElement("img");
      img.src = image;
      img.alt = imageAlt || "";
      img.decoding = "async";
      figure.classList.add("has-image");
      if (atEnd) figure.classList.add("closing-picture");
      figure.append(img);
    } else {
      figure.innerHTML = pictureIcon;
      const caption = document.createElement("figcaption");
      caption.textContent = "Hier entsteht eine Illustration";
      figure.append(caption);
    }
    return figure;
  }

  function createFragment({ block, start, end }) {
    if (block.type === "picture") return createPicture(block.value);

    const element = document.createElement(block.type === "title" ? "h2" : "p");
    if (block.type !== "title") element.className = "page-text";
    if (start > 0) element.classList.add("page-continuation");
    const text = block.value.slice(start, end);
    if (block.type === "closing") {
      const strong = document.createElement("strong");
      strong.textContent = text;
      element.append(strong);
    } else {
      element.textContent = text;
    }
    return element;
  }

  function renderPage(element, fragments, pageIndex) {
    const content = createContent();
    if (fragments) {
      for (const fragment of fragments) content.append(createFragment(fragment));
      content.append(createNumber(pageIndex));
    }
    element.replaceChildren(content);
    element.classList.toggle("empty-page", !fragments);
    element.setAttribute("aria-label", fragments ? `Seite ${pageIndex + 1}` : "Leere Abschlussseite");
  }

  function findFittingEnd(ends, start, fits) {
    let low = 0;
    let high = ends.length - 1;
    let best = start;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const end = ends[middle];
      if (end <= start || fits(end)) {
        if (end > start) best = end;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return best;
  }

  function graphemeEnds(text) {
    if (segmenter) return Array.from(segmenter.segment(text), part => part.index + part.segment.length);
    let offset = 0;
    return Array.from(text, char => (offset += char.length));
  }

  function paginate(blocks, book) {
    const measuring = document.createElement("div");
    measuring.className = "book-pages page-measurement";
    measuring.setAttribute("aria-hidden", "true");
    const page = document.createElement("div");
    page.className = "page page--left";
    const content = createContent();
    const number = createNumber(0);
    content.append(number);
    page.append(content);
    measuring.append(page);
    book.append(measuring);

    const pages = [];
    let fragments = [];
    const pageBottom = content.getBoundingClientRect().bottom;
    const overflow = () => number.getBoundingClientRect().bottom - pageBottom;

    function finishPage() {
      if (!fragments.length) return;
      pages.push(fragments);
      fragments = [];
      number.textContent = String(pages.length + 1);
      content.replaceChildren(number);
    }

    function appendFragment(fragment) {
      const node = createFragment(fragment);
      number.before(node);
      return node;
    }

    function fitsOnFreshPage(node) {
      const previous = [...content.children].slice(0, -2);
      for (const child of previous) child.remove();
      const fits = overflow() <= 0.25;
      node.before(...previous);
      return fits;
    }

    try {
      for (const block of blocks) {
        if (block.startsStory) finishPage();
        if (block.type === "picture") {
          const fragment = { block, start: 0, end: 1 };
          appendFragment(fragment);
          if (overflow() > 0.25 && fragments.length) {
            finishPage();
            appendFragment(fragment);
          }
          if (overflow() > 0.25) return { extraHeight: overflow() };
          fragments.push(fragment);
          continue;
        }

        const text = block.value;
        let start = 0;
        let words;
        let graphemes;
        while (start < text.length) {
          const fragment = { block, start, end: text.length };
          const node = appendFragment(fragment);
          if (overflow() <= 0.25) {
            fragments.push(fragment);
            break;
          }

          const target = node.querySelector("strong") || node;
          const keepTogether = fragments.length && start === 0 && fitsOnFreshPage(node);
          const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
          const fits = end => {
            target.textContent = text.slice(start, end);
            return overflow() <= 0.25;
          };
          words ??= Array.from(text.matchAll(/\S+\s*/gu), match => match.index + match[0].length);
          // Einen Absatz aufteilen, wenn auf beiden Seiten wenigstens zwei Zeilen stehen.
          const fitsWithRemainder = end => {
            target.textContent = text.slice(end);
            return node.offsetHeight > lineHeight + 1 && fits(end);
          };
          let end = start;
          if (!keepTogether) {
            end = findFittingEnd(words, start, fits);
          } else if (block.type === "text" && node.offsetHeight > lineHeight * 3 + 1) {
            end = findFittingEnd(words, start, fitsWithRemainder);
            if (!fits(end) || node.offsetHeight <= lineHeight + 1) end = start;
          }
          if (end === start && !fragments.length) {
            graphemes ??= graphemeEnds(text);
            end = findFittingEnd(graphemes, start, fits);
          }
          if (end === start && !fragments.length) {
            const firstEnd = graphemes.find(offset => offset > start);
            fits(firstEnd);
            return { extraHeight: overflow() };
          }
          if (end > start) {
            fragments.push({ block, start, end });
            start = end;
          }
          finishPage();
        }
      }
      finishPage();
      return { pages };
    } finally {
      measuring.remove();
    }
  }

  window.BookPagination = { collectBlocks, paginate, renderPage };
})();
