document.querySelectorAll('.hero-nav-shell').forEach((shell) => {
  const toggle = shell.querySelector('.mobile-nav-toggle');
  const navigation = shell.querySelector('.hero-legal-nav');

  if (!toggle || !navigation) {
    return;
  }

  const setOpen = (open) => {
    shell.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Hauptnavigation schließen' : 'Hauptnavigation öffnen');
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!shell.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 721px)').addEventListener('change', (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
});
