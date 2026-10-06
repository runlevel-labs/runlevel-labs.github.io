(function () {
  "use strict";

  var MIN_VIEWPORT_WIDTH = 341;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var timerId = null;
  var activeElement = null;
  var epilogue = null;
  var epilogueTimerId = null;

  function removeEpilogue() {
    if (epilogueTimerId !== null) {
      window.clearTimeout(epilogueTimerId);
      epilogueTimerId = null;
    }
    if (epilogue) {
      epilogue.remove();
      epilogue = null;
    }
  }

  function showEpilogue() {
    removeEpilogue();
    if (!motionAllowed() || document.hidden || !document.body) {
      return;
    }
    epilogue = document.createElement("div");
    epilogue.className = "kissendieb-epilogue";
    epilogue.setAttribute("role", "status");
    epilogue.textContent = "Kissen verschwunden. Codi auch. Ermittlungen laufen.";
    document.body.appendChild(epilogue);
    epilogueTimerId = window.setTimeout(removeEpilogue, 5500);
  }

  function motionAllowed() {
    return !reducedMotion.matches && window.innerWidth >= MIN_VIEWPORT_WIDTH;
  }

  function clearTimer() {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  function removeActiveElement() {
    if (activeElement) {
      activeElement.remove();
      activeElement = null;
    }
  }

  function show(direction, duration) {
    if (activeElement || !motionAllowed() || !document.body) {
      return false;
    }

    removeEpilogue();

    var travelDirection = direction === "rtl" ? "rtl" : "ltr";
    var tourDuration = Number.isFinite(duration) ? duration : 11000;
    var wrapper = document.createElement("div");
    var sprite = document.createElement("div");
    var speech = document.createElement("div");

    wrapper.className = "sir-codi-run sir-codi-run--" + travelDirection;
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.setProperty("--codi-tour-duration", tourDuration + "ms");

    sprite.className = "sir-codi-run__sprite";
    speech.className = "sir-codi-run__speech";
    speech.textContent = "Gina! Das Kissen!";

    wrapper.appendChild(sprite);
    wrapper.appendChild(speech);
    document.body.appendChild(wrapper);
    activeElement = wrapper;

    wrapper.addEventListener("animationend", function (event) {
      if (event.target === wrapper) {
        removeActiveElement();
        showEpilogue();
      }
    });

    return true;
  }

  function followGina(event) {
    var detail = event.detail || {};

    clearTimer();
    timerId = window.setTimeout(function () {
      timerId = null;

      if (!document.hidden) {
        show(detail.direction, detail.duration);
      }
    }, Math.round((detail.duration || 8500) * (window.innerWidth <= 480 ? 0.24 : 0.16)));
  }

  function handleMotionChange() {
    if (!motionAllowed()) {
      removeEpilogue();
      clearTimer();
      removeActiveElement();
    }
  }

  window.SirCodiRun = Object.freeze({
    show: show
  });

  window.addEventListener("gina-kissendieb:show", followGina);
  window.addEventListener("resize", handleMotionChange, { passive: true });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }
})();
