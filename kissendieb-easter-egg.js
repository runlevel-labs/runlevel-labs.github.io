(function () {
  "use strict";

  var INITIAL_DELAY_MIN = 9000;
  var INITIAL_DELAY_MAX = 14000;
  var REPEAT_DELAY_MIN = 90000;
  var REPEAT_DELAY_MAX = 180000;
  var TOUR_DURATION_MIN = 7500;
  var TOUR_DURATION_MAX = 9500;
  var MIN_VIEWPORT_WIDTH = 341;
  var SOUND_CHANCE = 0.75;
  var SOUND_SRC = "audio/kissendieb.wav";
  var DEBUG = false;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var timerId = null;
  var activeElement = null;
  var epilogue = null;
  var epilogueTimerId = null;
  var activeFollower = null;
  var sound = null;
  var hasUserInteracted = false;
  var started = false;

  function debugLog(message, detail) {
    if (!DEBUG || !window.console || typeof window.console.info !== "function") {
      return;
    }

    if (detail) {
      window.console.info("[kissendieb] " + message, detail);
    } else {
      window.console.info("[kissendieb] " + message);
    }
  }

  function randomBetween(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

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

  function rememberUserInteraction(event) {
    debugLog("interaction event received", event.type + " trusted=" + event.isTrusted);

    if (!event.isTrusted || hasUserInteracted) {
      return;
    }

    hasUserInteracted = true;
    debugLog("user interaction detected", event.type);
    sound = new Audio(SOUND_SRC);
    sound.preload = "auto";
    sound.loop = false;
    sound.volume = 0.65;

    document.removeEventListener("pointerdown", rememberUserInteraction);
    document.removeEventListener("keydown", rememberUserInteraction);
  }

  function stopSound() {
    if (sound && !sound.paused) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  function maybePlaySound(playbackState, ignoreChance) {
    if (
      playbackState.played ||
      playbackState.pending ||
      !hasUserInteracted ||
      !sound ||
      !motionAllowed() ||
      (!ignoreChance && Math.random() >= SOUND_CHANCE)
    ) {
      return;
    }

    playbackState.pending = true;

    try {
      sound.currentTime = 0;
      var playPromise = sound.play();

      if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(function () {
          playbackState.played = true;
          playbackState.pending = false;
          debugLog("play success");
        }, function () {
          playbackState.pending = false;
          debugLog("play blocked / play failed");
        });
      } else {
        playbackState.played = true;
        playbackState.pending = false;
        debugLog("play success");
      }
    } catch (error) {
      playbackState.pending = false;
      debugLog("play blocked / play failed", error.name || "error");
      // Browser duerfen Audio weiterhin still blockieren.
    }
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

    if (activeFollower) {
      activeFollower.remove();
      activeFollower = null;
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

    removeEpilogue();

    var travelDirection = direction === "ltr" || direction === "rtl"
      ? direction
      : Math.random() < 0.5 ? "ltr" : "rtl";

    var link = document.createElement("a");
    var sprite = document.createElement("span");
    var follower = document.createElement("div");
    var followerSprite = document.createElement("div");
    var followerSpeech = document.createElement("div");
    var playbackState = { played: false, pending: false };
    var tourDuration = randomBetween(TOUR_DURATION_MIN, TOUR_DURATION_MAX);
    var followerDelay = Math.round(tourDuration * (window.innerWidth <= 480 ? 0.24 : 0.16));

    link.className = "home-kissendieb home-kissendieb--" + travelDirection;
    link.href = "dieb/index.html";
    link.setAttribute("aria-label", "Kissen-404: Gina und die Fallakte öffnen");
    link.title = "Psst … die Kissen-Fallakte öffnen";
    link.style.setProperty(
      "--home-kissendieb-duration",
      tourDuration + "ms"
    );

    sprite.className = "home-kissendieb__sprite";
    sprite.setAttribute("aria-hidden", "true");
    link.appendChild(sprite);

    follower.className = "home-sir-codi home-sir-codi--" + travelDirection;
    follower.setAttribute("aria-hidden", "true");
    follower.style.setProperty("--home-kissendieb-duration", tourDuration + "ms");
    followerSprite.className = "home-sir-codi__sprite";
    followerSpeech.className = "home-sir-codi__speech";
    followerSpeech.textContent = "Gina! Das Kissen!";
    follower.appendChild(followerSprite);
    follower.appendChild(followerSpeech);

    document.body.appendChild(link);
    activeElement = link;
    activeFollower = follower;

    follower.style.animationDelay = followerDelay + "ms";
    document.body.appendChild(follower);

    debugLog("thief run started");
    debugLog("auto sound attempt");
    maybePlaySound(playbackState, false);

    // Keep both runners and their steps paused, including a delayed start.
    var hovered = false;
    var focused = false;
    function syncPause() {
      var paused = hovered || focused;
      link.classList.toggle("is-paused", paused);
      follower.classList.toggle("is-paused", paused);
    }
    link.addEventListener("mouseenter", function () {
      maybePlaySound(playbackState, true);
      hovered = true;
      syncPause();
    });
    link.addEventListener("mouseleave", function () {
      hovered = false;
      syncPause();
    });
    link.addEventListener("focus", function () {
      focused = true;
      syncPause();
    });
    link.addEventListener("blur", function () {
      focused = false;
      syncPause();
    });

    link.addEventListener("animationend", function (event) {
      if (event.target !== link) {
        return;
      }

      link.remove();
    });

    follower.addEventListener("animationend", function (event) {
      if (event.target !== follower) {
        return;
      }

      removeActiveElement();
      showEpilogue();
      scheduleNext(false);
    });

    return true;
  }

  function handleMotionChange() {
    if (!motionAllowed()) {
      removeEpilogue();
      clearTimer();
      removeActiveElement();
      stopSound();
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

  window.RunlevelKissendieb = Object.freeze({
    show: show
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }

  window.addEventListener("resize", handleMotionChange, { passive: true });
  document.addEventListener("pointerdown", rememberUserInteraction, { passive: true });
  document.addEventListener("keydown", rememberUserInteraction);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
