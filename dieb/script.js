// KISSEN-404 – kleine Logik
// Zufällige Statusmeldung für die Ermittlungsakte.

// Kompaktes Hauptmenü auf kleinen Bildschirmen.
(() => {
  const shell = document.querySelector(".navigation");
  const toggle = shell?.querySelector(".mobile-nav-toggle");
  const navigation = shell?.querySelector(".hauptnavigation");

  if (!shell || !toggle || !navigation) {
    return;
  }

  function setOpen(open) {
    shell.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Hauptnavigation schließen" : "Hauptnavigation öffnen");
  }

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!shell.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
})();

(() => {
  const statusButton = document.querySelector("#statusButton");
  const statusAusgabe = document.querySelector("#statusAusgabe");

  const meldungen = [
    "✅ Alle Kissen anwesend. Gina lächelt verdächtig.",
    "👻 Leichte Geisteraktivität erkannt. Keine akute Kissenflucht.",
    "🛏️ Ein Kissen wirkt minimal verschoben. Ermittlungen laufen.",
    "☕ Kaffeepegel ausreichend. Kissenkontrolle kann fortgesetzt werden.",
    "🔎 Keine Spuren am Tatort. Das macht Gina nicht weniger verdächtig.",
    "🌙 Quiet Hours erkannt. Most of the time.",
    "📡 Serverraum meldet: keine Störung, aber ein Kissen sendet schwach.",
    "💙 Gina bestreitet alles. Die Beweislage bleibt charmant.",
    "⚙️ Sir Codi wurde befragt. Antwort: Tokens sparen, Kissen zählen.",
    "✅ Kontrollgang beendet. Kissenbestand vollständig."
  ];

  let letzteMeldung = -1;

  function zufallsIndex() {
    if (meldungen.length === 1) return 0;

    let index = Math.floor(Math.random() * meldungen.length);

    while (index === letzteMeldung) {
      index = Math.floor(Math.random() * meldungen.length);
    }

    letzteMeldung = index;
    return index;
  }

  function pruefeKissenstatus() {
    const index = zufallsIndex();

    statusAusgabe.classList.remove("aktiv");
    void statusAusgabe.offsetWidth;

    statusAusgabe.textContent = meldungen[index];
    statusAusgabe.classList.add("aktiv");
  }

  if (statusButton && statusAusgabe) {
    statusButton.addEventListener("click", pruefeKissenstatus);
  }
})();

// Bildergalerien für die gesicherten Beweisstücke.
(() => {
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carousel) => {
    const viewport = carousel.querySelector(".karussell");
    const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const dotsContainer = carousel.querySelector("[data-carousel-dots]");
    const counter = carousel.querySelector("[data-carousel-counter]");

    if (!viewport || !prevButton || !nextButton || !dotsContainer || !counter || slides.length === 0) {
      return;
    }

    let currentIndex = 0;
    let touchStartX = 0;

    const dots = slides.map((_, index) => {
      const dot = document.createElement("button");
      dot.className = "karussell-punkt";
      dot.type = "button";
      dot.setAttribute("aria-label", `Bild ${index + 1} anzeigen`);
      dot.addEventListener("click", () => showSlide(index));
      dotsContainer.append(dot);
      return dot;
    });

    function showSlide(index) {
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === currentIndex;
        slide.hidden = !isActive;
        slide.classList.toggle("ist-aktiv", isActive);
      });

      dots.forEach((dot, dotIndex) => {
        if (dotIndex === currentIndex) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      counter.textContent = `${currentIndex + 1} / ${slides.length}`;
    }

    if (slides.length === 1) {
      prevButton.hidden = true;
      nextButton.hidden = true;
      dotsContainer.hidden = true;
      counter.hidden = true;
    } else {
      prevButton.addEventListener("click", () => showSlide(currentIndex - 1));
      nextButton.addEventListener("click", () => showSlide(currentIndex + 1));

      viewport.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showSlide(currentIndex - 1);
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          showSlide(currentIndex + 1);
        }
      });

      viewport.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });

      viewport.addEventListener("touchend", (event) => {
        const swipeDistance = event.changedTouches[0].clientX - touchStartX;

        if (Math.abs(swipeDistance) < 50) return;
        showSlide(currentIndex + (swipeDistance < 0 ? 1 : -1));
      }, { passive: true });
    }

    showSlide(0);
  });
})();

// Markiert den aktuell sichtbaren Hauptabschnitt in der Navigation.
(() => {
  const navLinks = [...document.querySelectorAll('.nav-liste a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (navLinks.length === 0 || sections.length === 0) {
    return;
  }

  function setActiveSection(sectionId) {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("ist-aktiv", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  let updatePending = false;

  function updateActiveSection() {
    const markerPosition = window.innerHeight * 0.32;
    const visibleSection = sections.find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= markerPosition && bounds.bottom > markerPosition;
    });

    setActiveSection(visibleSection ? visibleSection.id : "");
    updatePending = false;
  }

  function requestSectionUpdate() {
    if (updatePending) return;

    updatePending = true;
    window.requestAnimationFrame(updateActiveSection);
  }

  window.addEventListener("scroll", requestSectionUpdate, { passive: true });
  window.addEventListener("resize", requestSectionUpdate);
  requestSectionUpdate();
})();
