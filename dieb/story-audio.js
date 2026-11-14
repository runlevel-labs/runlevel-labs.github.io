// Wie auf der Startseite: native Audio-Elemente statt fetch/Web Audio.
// So funktioniert die Story auch beim direkten lokalen Öffnen (file://).
(() => {
  const buehne = document.querySelector('.fuss-buehne');
  const schalter = document.querySelector('.story-ton-schalter');
  if (!buehne || !schalter) return;

  const audioBasis = new URL('story/', document.currentScript.src);
  // Gemessene mittlere Pegel: -23,0 / -23,5 / -22,5 dBFS.
  // Nur die Wiedergabe angleichen, Originaldateien erhalten.
  const stimmen = {
    3: { datei: 'gina-1.wav', pegel: 0.891 },
    5: { datei: 'codi-1.wav', pegel: 0.944 },
    7: { datei: 'gina-2.wav', pegel: 0.841 }
  };
  const gespielt = new Set();
  let freigabe;
  // Gewünschter Tonzustand und tatsächliche Browserfreigabe sind getrennt.
  let tonAn = true;
  let aktivierungNoetig = false;
  let versuch = 0;
  let wiedergabe = 0;
  let aktuell;
  let ausstehend;
  let timer;
  let szene = 1;
  let einsatzBereit = false;
  let abgeschlossen = buehne.classList.contains('story-abgeschlossen');

  function aktualisiereSchalter() {
    schalter.textContent = `Story-Ton: ${aktivierungNoetig ? 'Aktivieren' : tonAn ? 'an' : 'aus'}`;
    schalter.setAttribute('aria-pressed', String(tonAn && !aktivierungNoetig));
    schalter.setAttribute('aria-label', aktivierungNoetig ? 'Story-Ton aktivieren' : tonAn ? 'Story-Ton ausschalten' : 'Story-Ton einschalten');
  }

  function stoppen() {
    wiedergabe += 1;
    ausstehend = null;
    if (aktuell) {
      aktuell.pause();
      aktuell.currentTime = 0;
      aktuell = null;
    }
  }

  function stumm() {
    tonAn = false;
    aktivierungNoetig = false;
    versuch += 1;
    stoppen();
    aktualisiereSchalter();
  }

  function protokolliereFehler(fehler, stimme) {
    const protokoll = fehler.name === 'NotAllowedError' ? console.info : console.warn;
    protokoll.call(console, '[Kissen-404 Audio]', {
      datei: stimme?.audio?.src,
      szene,
      name: fehler.name,
      meldung: fehler.message,
      medienFehler: stimme?.audio?.error?.code
    });
  }

  function warteAufAktivierung() {
    freigabe = null;
    aktivierungNoetig = true;
    stoppen();
    aktualisiereSchalter();
  }

  // Nur vorladen, kein stummes Autoplay beim Seitenaufruf. Der erste hörbare
  // play()-Versuch erfolgt am Szeneneinsatz unter den normalen Browserregeln.
  Object.values(stimmen).forEach((stimme) => {
    const audio = stimme.audio = new Audio(new URL(stimme.datei, audioBasis).href);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = stimme.pegel;
    stimme.bereit = true;
  });

  function bereiteStimmenVor() {
    // Alle play()-Aufrufe direkt im bewussten Klick ausführen. Stummes kurzes
    // Anspielen gibt auch mobilen Browsern jedes spätere Audio-Element frei.
    return Promise.all(Object.values(stimmen).map((stimme) => {
      const audio = stimme.audio ||= new Audio(new URL(stimme.datei, audioBasis).href);
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = stimme.pegel;
      audio.muted = true;
      stimme.bereit = false;
      function fehlgeschlagen(fehler) {
        audio.pause();
        protokolliereFehler(fehler, stimme);
        throw fehler;
      }
      try {
        return Promise.resolve(audio.play()).then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
          stimme.bereit = true;
        }, fehlgeschlagen);
      } catch (fehler) {
        protokolliereFehler(fehler, stimme);
        return Promise.reject(fehler);
      }
    }));
  }

  aktualisiereSchalter();
  schalter.hidden = false;
  schalter.addEventListener('click', async () => {
    if (tonAn && !aktivierungNoetig) {
      stumm();
      return;
    }

    const dieserVersuch = ++versuch;
    tonAn = true;
    aktivierungNoetig = false;
    aktualisiereSchalter();
    try {
      freigabe ||= bereiteStimmenVor().catch((fehler) => {
        freigabe = null;
        throw fehler;
      });
      await freigabe;
      if (dieserVersuch === versuch && tonAn && einsatzBereit) sprechen(szene);
    } catch {
      if (dieserVersuch === versuch) {
        warteAufAktivierung();
      }
    }
  });

  function sprechen(nummer) {
    const stimme = stimmen[nummer];
    if (!tonAn || document.hidden || !stimme?.bereit || gespielt.has(nummer) || ausstehend === nummer) return;
    stoppen();
    const dieseWiedergabe = wiedergabe;
    const audio = stimme.audio;
    aktuell = audio;
    ausstehend = nummer;
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = stimme.pegel;

    function fehlgeschlagen(fehler) {
      // pause() beim Szenenwechsel darf einen noch offenen play()-Aufruf abbrechen.
      if (dieseWiedergabe !== wiedergabe) return;
      protokolliereFehler(fehler, stimme);
      warteAufAktivierung();
    }

    try {
      Promise.resolve(audio.play()).then(() => {
        if (dieseWiedergabe !== wiedergabe) return;
        gespielt.add(nummer);
        ausstehend = null;
        aktivierungNoetig = false;
        aktualisiereSchalter();
      }, fehlgeschlagen);
    } catch (fehler) {
      fehlgeschlagen(fehler);
    }
  }

  const szenen = [
    null, null, '.fuss-szene-zwei', '.fuss-szene-drei',
    '.fuss-szene-vier', '.fuss-szene-fuenf', '.fuss-szene-sechs'
  ];
  buehne.addEventListener('animationstart', (event) => {
    if (event.animationName !== 'fuss-szene-einblenden') return;
    const nummer = szenen.findIndex((selektor) => selektor && event.target.matches(selektor));
    if (nummer < 2) return;
    window.clearTimeout(timer);
    stoppen();
    szene = nummer;
    einsatzBereit = false;
    if (nummer === 2) gespielt.clear();
    if (nummer === 3) {
      // Der Einsatz folgt auch der verkürzten reduced-motion-Überblendung.
      const dauer = parseFloat(getComputedStyle(event.target).animationDuration) * 1000;
      timer = window.setTimeout(() => {
        if (szene !== nummer) return;
        einsatzBereit = true;
        sprechen(nummer);
      }, dauer * 0.4);
    } else if (nummer === 5) {
      einsatzBereit = true;
      sprechen(nummer);
    }
  });

  function sprichZumSichtbarenFinale() {
    if (szene !== 7 || !buehne.classList.contains('story-abgeschlossen') || document.hidden) return;
    if (Number(getComputedStyle(buehne.querySelector('.fuss-szene-finale')).opacity) > 0) {
      einsatzBereit = true;
      sprechen(7);
    } else {
      window.requestAnimationFrame(sprichZumSichtbarenFinale);
    }
  }

  new MutationObserver(() => {
    const fertig = buehne.classList.contains('story-abgeschlossen');
    if (!buehne.classList.contains('story-gestartet')) {
      window.clearTimeout(timer);
      stoppen();
      gespielt.clear();
      szene = 1;
      einsatzBereit = false;
    }
    if (fertig && !abgeschlossen) {
      window.clearTimeout(timer);
      stoppen();
      szene = 7;
      einsatzBereit = false;
      window.requestAnimationFrame(sprichZumSichtbarenFinale);
    }
    abgeschlossen = fertig;
  }).observe(buehne, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stoppen();
  });
  window.addEventListener('pagehide', () => stumm());
})();
