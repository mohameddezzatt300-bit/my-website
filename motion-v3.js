/* =========================================================
   v3 motion + UX layer — GSAP ScrollTrigger + Lenis
   Runs after animations-v2.js. Every feature degrades safely:
   if the CDN libs fail to load, the v2 site still works.
   ========================================================= */
(function () {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverable = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isHome = !!document.querySelector('.hero .hero-grid');
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Page transition: reveal on arrival ---------- */
  const revealPage = () => {
    if (html.classList.contains('pt-in')) requestAnimationFrame(() => html.classList.add('pt-done'));
  };
  if (document.readyState === 'complete') revealPage(); else addEventListener('load', revealPage);
  setTimeout(revealPage, 600); // never wait on slow images
  addEventListener('pageshow', e => { if (e.persisted) html.classList.remove('pt-out', 'pt-in', 'pt-done'); });

  /* ---------- Page transition: cover on leave ---------- */
  if (!reduce) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return; // same-page anchor
      e.preventDefault();
      try { sessionStorage.setItem('m3pt', '1'); } catch (_) {}
      html.classList.remove('pt-in', 'pt-done');
      void html.offsetWidth;
      html.classList.add('pt-out');
      setTimeout(() => { location.href = url.href; }, 480);
    });
  }

  /* ---------- Skip link + main landmark ---------- */
  const firstSection = document.querySelector('header.hero, .case-hero, main, section');
  if (firstSection) {
    if (!firstSection.id) firstSection.id = 'main';
    const skip = document.createElement('a');
    skip.className = 'm3-skip';
    skip.href = '#' + firstSection.id;
    skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  }

  /* ---------- Back to top with progress ring ---------- */
  const top = document.createElement('button');
  top.className = 'm3-top';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<svg class="ring" viewBox="0 0 50 50"><circle cx="25" cy="25" r="23" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(top);
  const ring = top.querySelector('circle');

  /* ---------- Mobile sticky Book-a-call ---------- */
  const sticky = document.createElement('a');
  sticky.className = 'm3-sticky';
  sticky.href = isHome ? '#book' : 'index.html#book';
  sticky.innerHTML = '<span class="pulse"></span>Book a free 30-min call';
  document.body.appendChild(sticky);
  const contact = document.getElementById('contact');
  let contactVisible = false;
  if (contact) new IntersectionObserver(es => { contactVisible = es[0].isIntersecting; onScroll(); }, { threshold: 0.05 }).observe(contact);

  function onScroll() {
    const y = scrollY;
    const max = html.scrollHeight - innerHeight;
    ring.style.strokeDashoffset = String(100 - Math.min(100, (y / Math.max(1, max)) * 100));
    top.classList.toggle('show', y > innerHeight * 0.9);
    sticky.classList.toggle('show', y > innerHeight * 0.6 && !contactVisible);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor ring ---------- */
  if (hoverable && !reduce) {
    const c = document.createElement('div');
    c.className = 'm3-cursor';
    document.body.appendChild(c);
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); }, { passive: true });
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
    addEventListener('mousedown', () => c.classList.add('down'));
    addEventListener('mouseup', () => c.classList.remove('down'));
    document.addEventListener('mouseover', e => {
      c.classList.toggle('hover', !!e.target.closest('a, button, .case, .svc, .channel, [role="button"]'));
    });
    (function tick() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    })();
  }

  if (!hasGsap || reduce) return;

  /* =================== GSAP from here =================== */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && hoverable) {
    lenis = new window.Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // Pause smooth scroll whenever v2 locks the body (mobile drawer, lightbox)
    new MutationObserver(() => {
      document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ['style'] });

    document.querySelectorAll('.calendly-inline-widget').forEach(el => el.setAttribute('data-lenis-prevent', ''));
  }

  // Anchor links: intercept before v2's handlers so Lenis owns the scroll
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    if (lenis) lenis.scrollTo(t, { offset: -40, duration: 1.4 });
    else scrollTo({ top: t.getBoundingClientRect().top + scrollY - 40, behavior: 'smooth' });
  }, true);

  // Arriving at index.html#book from another page
  if (location.hash && lenis) {
    const t = document.querySelector(location.hash);
    if (t) setTimeout(() => lenis.scrollTo(t, { offset: -40, immediate: true }), 50);
  }

  top.addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Reliable reveals: fire even when a fast scroll jumps past ---------- */
  document.querySelectorAll('.rv, [data-stg], .stat').forEach(el => {
    ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true, onEnter: () => el.classList.add('in') });
  });

  /* ---------- Word-split headings ---------- */
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'm3-w';
            const i = document.createElement('span'); i.className = 'm3-wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          // Gradient text (background-clip:text) breaks if split — move it as one unit
          if (getComputedStyle(n).webkitBackgroundClip === 'text' || getComputedStyle(n).backgroundClip === 'text') {
            const w = document.createElement('span'); w.className = 'm3-w';
            n.replaceWith(w); w.appendChild(n); n.classList.add('m3-wi');
          } else walk(n);
        }
      });
    };
    walk(el);
    return el.querySelectorAll('.m3-wi');
  };

  document.querySelectorAll('.section-title, .footer-big, .contact-block h3').forEach(el => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115, rotate: 4, duration: 0.9, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ---------- Section labels: line draws in ---------- */
  document.querySelectorAll('.section-label').forEach(el => {
    gsap.from(el, { letterSpacing: '0.4em', opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---------- Hero: content drifts out, portrait parallax ---------- */
  const hero = document.querySelector('.hero');
  if (hero && isHome) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 721px)', () => {
      gsap.to('.hero-main', { yPercent: -12, opacity: 0.15, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.fromTo('.hero-portrait', { clipPath: 'inset(0% 0% 0% 0% round 20px)' },
        { clipPath: 'inset(6% 8% 14% 8% round 28px)', ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.set('.hero-portrait .portrait', { transition: 'none' });
      gsap.to('.hero-portrait .portrait', { scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.scroll-hint', { opacity: 0, y: 20, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '20% top', scrub: true } });
  }

  /* ---------- Ticker reacts to scroll velocity ---------- */
  const ticker = document.querySelector('.ticker');
  if (ticker) {
    const skewTo = gsap.quickTo(ticker, 'skewX', { duration: 0.5, ease: 'power3' });
    const track = ticker.querySelector('.ticker-track');
    ScrollTrigger.create({
      trigger: ticker, start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        const v = gsap.utils.clamp(-8, 8, self.getVelocity() / -250);
        skewTo(v);
        if (track) track.getAnimations().forEach(a => { a.playbackRate = 1 + Math.min(4, Math.abs(v) / 2); });
      }
    });
  }

  /* ---------- Stats grid: tilts up as it enters (inner node, not the .rv wrapper) ---------- */
  const stats = document.querySelector('.stats-wrap .stats');
  if (stats) {
    gsap.fromTo(stats, { scale: 0.95, rotateX: 10, transformPerspective: 1200 },
      { scale: 1, rotateX: 0, ease: 'none',
        scrollTrigger: { trigger: stats, start: 'top 98%', end: 'top 50%', scrub: 0.6 } });
  }

  /* ---------- Channel logos pop in ---------- */
  gsap.utils.toArray('.channel .logo').forEach((el, i) => {
    gsap.from(el, { scale: 0.4, rotate: -12, opacity: 0, duration: 0.8, ease: 'back.out(2)', delay: i * 0.06,
      scrollTrigger: { trigger: '.channels', start: 'top 85%', once: true } });
  });

  /* ---------- Case studies: clip reveal + inner parallax ---------- */
  gsap.utils.toArray('.case-visual').forEach(v => {
    gsap.fromTo(v, { clipPath: 'inset(14% 10% 14% 10% round 24px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: v, start: 'top 92%', end: 'top 40%', scrub: 0.6 } });
    const img = v.querySelector('img');
    if (img) {
      gsap.fromTo(v, { '--py': '-28px' }, { '--py': '28px', ease: 'none',
        scrollTrigger: { trigger: v, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  /* ---------- "20+ brands" block ---------- */
  const more = document.querySelector('.more-cases-num');
  if (more) {
    gsap.from(more, { scale: 0.6, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: more, start: 'top 85%', once: true } });
  }

  /* ---------- Generic image reveals on inner pages ---------- */
  gsap.utils.toArray('.screen img, .about-photo img, .case-hero img').forEach(img => {
    gsap.from(img, { scale: 1.15, opacity: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: img, start: 'top 90%', once: true } });
  });

  /* ---------- Active nav link per section ---------- */
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]:not(.cta)')];
  navLinks.forEach(a => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: self => a.classList.toggle('is-active', self.isActive)
    });
  });

  // Images loading late shift layout — keep triggers accurate
  addEventListener('load', () => ScrollTrigger.refresh());
})();
