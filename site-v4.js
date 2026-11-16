/* =========================================================
   v4 shared shell — header, menu, page transitions.
   On inner pages it injects the header; on the home page
   the header is already in the HTML.
   ========================================================= */
(function () {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Inject header + menu on pages that don't have it ---------- */
  if (!document.querySelector('.v4-bar')) {
    // v4 is dark-only; the old theme toggle lived in the nav this replaces
    try { localStorage.removeItem('me-theme'); } catch (_) {}
    html.setAttribute('data-mode', 'dark');
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <header class="v4-bar">
        <a href="index.html" class="v4-logo" aria-label="M·EZZAT home"><span class="v4-logo-dot"></span>M·EZZAT</a>
        <div class="v4-bar-right">
          <a href="index.html#book" class="v4-pill v4-pill-solid">Book a call</a>
          <button class="v4-pill v4-menu-btn" aria-expanded="false" aria-controls="v4Menu"><span class="v4-menu-label">Menu</span><span class="v4-burger"><i></i><i></i><i></i></span></button>
        </div>
      </header>
      <div class="v4-menu" id="v4Menu" aria-hidden="true">
        <nav class="v4-menu-links">
          <a href="index.html#work"><small>01</small>Work</a>
          <a href="index.html#services"><small>02</small>Services</a>
          <a href="about.html"><small>03</small>About</a>
          <a href="index.html#book"><small>04</small>Book a call</a>
        </nav>
        <div class="v4-menu-foot">
          <a href="https://wa.me/201092769154" target="_blank" rel="noopener">WhatsApp ↗</a>
          <a href="https://www.linkedin.com/in/mohamed-ezzat-338437288/" target="_blank" rel="noopener">LinkedIn ↗</a>
          <a href="mailto:mohameddezzatt300@gmail.com">Email ↗</a>
          <span>Alexandria · Egypt — replies in &lt; 24h</span>
        </div>
      </div>`;
    document.body.prepend(...wrap.children);
  }

  const bar = document.querySelector('.v4-bar');
  const btn = document.querySelector('.v4-menu-btn');
  const menu = document.getElementById('v4Menu');

  /* ---------- Menu open/close ---------- */
  const setMenu = open => {
    html.classList.toggle('v4-open', open);
    html.classList.toggle('v4-lock', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    btn.querySelector('.v4-menu-label') && (btn.querySelector('.v4-menu-label').textContent = open ? 'Close' : 'Menu');
    window.__lenis && (open ? window.__lenis.stop() : window.__lenis.start());
    if (open) bar.classList.remove('is-hidden');
  };
  btn.addEventListener('click', () => setMenu(!html.classList.contains('v4-open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('v4-open')) setMenu(false); });

  /* ---------- Hide header on scroll down, show on scroll up ---------- */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!html.classList.contains('v4-open')) bar.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
  }, { passive: true });

  /* ---------- Page transitions ---------- */
  const reveal = () => { if (html.classList.contains('pt-in')) requestAnimationFrame(() => html.classList.add('pt-done')); };
  if (document.readyState === 'complete') reveal(); else addEventListener('load', reveal);
  setTimeout(reveal, 500);
  addEventListener('pageshow', e => { if (e.persisted) html.classList.remove('pt-out', 'pt-in', 'pt-done', 'v4-open', 'v4-lock'); });

  if (!reduce) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      const norm = p => p.replace(/index\.html$/, '');
      if (norm(url.pathname) === norm(location.pathname)) return; // same page → handled by anchor scroll
      e.preventDefault();
      e.stopImmediatePropagation();
      try { sessionStorage.setItem('m3pt', '1'); } catch (_) {}
      html.classList.remove('pt-in', 'pt-done');
      void html.offsetWidth;
      html.classList.add('pt-out');
      setTimeout(() => { location.href = url.href; }, 480);
    }, true);
  }
})();
