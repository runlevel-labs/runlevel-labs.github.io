(function () {
  "use strict";

  var INITIAL_DELAY_MIN = 8000;
  var INITIAL_DELAY_MAX = 12000;
  var REPEAT_DELAY_MIN = 60000;
  var REPEAT_DELAY_MAX = 150000;
  var TOUR_DURATION_MIN = 7500;
  var TOUR_DURATION_MAX = 9500;
  var MIN_VIEWPORT_WIDTH = 341;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var timerId = null;
  var activeElement = null;
  var started = false;

  function randomBetween(min, max) {
    return Math.round(min + Math.random() * (max - min));
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

  function scheduleNext(isInitial) {
    clearTimer();

    if (!started || !motionAllowed()) {
      return;
    }

    var min = isInitial ? INITIAL_DELAY_MIN : REPEAT_DELAY_MIN;
    var max = isInitial ? INITIAL_DELAY_MAX : REPEAT_DELAY_MAX;

    timerId = window.setTimeout(function () {
      timerId = null;

      if (document.hidden) {
        scheduleNext(false);
        return;
      }

      show();
    }, randomBetween(min, max));
  }

  function show(direction) {
    if (activeElement || !motionAllowed() || !document.body) {
      return false;
    }

    var travelDirection = direction === "ltr" || direction === "rtl"
      ? direction
      : Math.random() < 0.5 ? "ltr" : "rtl";

    var wrapper = document.createElement("div");
    var sprite = document.createElement("div");

    wrapper.className = "gina-kissendieb gina-kissendieb--" + travelDirection;
    wrapper.setAttribute("aria-hidden", "true");
    var tourDuration = randomBetween(TOUR_DURATION_MIN, TOUR_DURATION_MAX);

    wrapper.style.setProperty("--gina-tour-duration", tourDuration + "ms");

    sprite.className = "gina-kissendieb__sprite";
    wrapper.appendChild(sprite);
    document.body.appendChild(wrapper);
    activeElement = wrapper;

    window.dispatchEvent(new CustomEvent("gina-kissendieb:show", {
      detail: {
        direction: travelDirection,
        duration: tourDuration
      }
    }));

    wrapper.addEventListener("animationend", function (event) {
      if (event.target !== wrapper) {
        return;
      }

      removeActiveElement();
      scheduleNext(false);
    });

    return true;
  }

  function handleMotionChange() {
    if (!motionAllowed()) {
      clearTimer();
      removeActiveElement();
      return;
    }

    if (started && !activeElement && timerId === null) {
      scheduleNext(true);
    }
  }

  function start() {
    if (started) {
      return;
    }

    started = true;
    scheduleNext(true);
  }

  window.GinaKissendieb = Object.freeze({
    show: show
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }

  window.addEventListener("resize", handleMotionChange, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
