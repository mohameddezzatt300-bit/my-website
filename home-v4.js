/* =========================================================
   v4 home motion — GSAP + ScrollTrigger + Lenis
   ========================================================= */
(function () {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;

  /* ---------- Mobile sticky CTA (works without GSAP) ---------- */
  const sticky = document.querySelector('.v4-sticky');
  const book = document.getElementById('book');
  let bookVisible = false;
  if (book) new IntersectionObserver(es => { bookVisible = es[0].isIntersecting; upd(); }, { threshold: 0.02 }).observe(book);
  const wa = document.querySelector('.v4-wa');
  function upd() { const past = scrollY > innerHeight * 0.7; sticky && sticky.classList.toggle('show', past && !bookVisible); wa && wa.classList.toggle('show', past); }
  upd();
  addEventListener('scroll', upd, { passive: true });

  if (!hasGsap || reduce) { html.classList.remove('js'); return; }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && fine) {
    lenis = new window.Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4) });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const goTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.5, ...opts });
    else (typeof target === 'number' ? scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    const norm = p => p.replace(/index\.html$/, '');
    if (norm(url.pathname) !== norm(location.pathname) || !url.hash) return;
    const t = url.hash === '#main' ? 0 : document.querySelector(url.hash);
    if (t === null) return;
    e.preventDefault();
    goTo(t);
  });
  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t) addEventListener('load', () => goTo(t, { immediate: true }));
  }

  /* ---------- Split helpers ---------- */
  const splitChars = el => {
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(word => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'kw';
          [...word].forEach(ch => {
            const c = document.createElement('span'); c.className = 'kch'; c.textContent = ch;
            w.appendChild(c); out.push(c);
          });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return out;
  };
  const splitWords = (el, cls, innerCls) => {
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(word => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = cls;
          if (innerCls) { const i = document.createElement('span'); i.className = innerCls; i.textContent = word; w.appendChild(i); out.push(i); }
          else { w.textContent = word; out.push(w); }
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'IMG') walk(n);
    });
    walk(el);
    return out;
  };

  // Letters lift softly when hovered
  const hoverHop = chars => {
    if (!fine) return;
    chars.forEach(c => c.addEventListener('mouseenter', () => {
      if (gsap.isTweening(c)) return;
      gsap.timeline().to(c, { yPercent: -10, duration: 0.3, ease: 'power3.out' }).to(c, { yPercent: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    }));
  };

  /* ================= HERO ================= */
  const title = document.querySelector('.hero4-title');
  const heroChars = title ? splitChars(title) : [];
  gsap.set(title, { visibility: 'visible' });

  const line = document.querySelector('.chart .line');
  const len = line ? line.getTotalLength() : 0;
  if (line) gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  const glass = gsap.utils.toArray('.glass');

  /* ---------- Intro curtain (once per session): ROAS counter, then striped columns lift ---------- */
  const preOn = html.classList.contains('pre-on');
  let introDelay = html.classList.contains('pt-in') ? 0.6 : 0.15;
  if (preOn) {
    try { sessionStorage.setItem('preSeen', '1'); } catch (_) {}
    window.__lenis && window.__lenis.stop();
    const num = document.querySelector('.pre-num b'); const o = { v: 0 };
    const cols = gsap.utils.toArray('.pre-cols i');
    gsap.timeline({ onComplete: () => { html.classList.remove('pre-on'); window.__lenis && window.__lenis.start(); } })
      .from('.pre-ui > *', { y: 24, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06 })
      .to(o, { v: 9.85, duration: 1.7, ease: 'power3.inOut', onUpdate: () => { num.textContent = o.v.toFixed(2); } }, 0.2)
      .to('.pre-bar i', { scaleX: 1, duration: 1.7, ease: 'power3.inOut' }, 0.2)
      .to('.pre-ui', { yPercent: -40, opacity: 0, duration: 0.7, ease: 'power3.in' }, 2.05)
      .to(cols, { yPercent: -101, duration: 1.1, ease: 'expo.inOut', stagger: { each: 0.06, from: 'center' } }, 2.35);
    introDelay = 2.75;
  }

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: introDelay });
  intro
    .from('.orb', { scale: 0.4, opacity: 0, duration: 2.4, ease: 'power2.out' }, 0)
    .from('.hero4-tag', { y: 16, opacity: 0, duration: 1 }, 0.1)
    .from(heroChars, { yPercent: 115, opacity: 0, filter: 'blur(18px)', scaleY: 1.4, duration: 1.5, stagger: { each: 0.045, from: 'start' }, clearProps: 'filter' }, 0.15)
    .to(line, { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut' }, 0.35)
    .from('.chart .area', { opacity: 0, duration: 2, ease: 'power1.out' }, 1)
    .from('.chart .grid line', { scaleX: 0, transformOrigin: 'left center', duration: 1.6, stagger: 0.12 }, 0.3)
    .from('.chart .tip', { scale: 0, transformOrigin: 'center', duration: 0.9, ease: 'back.out(3)' }, 2.6)
    .from(glass, { y: 40, opacity: 0, scale: 0.92, duration: 1.2, stagger: 0.18 }, 1.2)
    .from('.hero4-sub, .v4-cta', { y: 24, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.9)
    .from('.hero4-scroll', { opacity: 0, duration: 0.8 }, 1.6);

  // Subtle hover lift on headline letters
  if (fine) heroChars.forEach(c => c.addEventListener('mouseenter', () => {
    if (gsap.isTweening(c)) return;
    gsap.timeline().to(c, { yPercent: -10, duration: 0.3, ease: 'power3.out' }).to(c, { yPercent: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
  }));

  // Glass cards drift; everything leans toward the mouse by depth
  glass.forEach((g, i) => gsap.to(g, { yPercent: i % 2 ? 14 : -14, duration: 3.6 + i, ease: 'sine.inOut', repeat: -1, yoyo: true }));
  if (fine) {
    const layers = [['.orb', 40], ['.g1', 26], ['.g2', 34], ['.g3', 18], ['.chart', 10]].map(([sel, d]) => {
      const el = document.querySelector(sel); if (!el) return null;
      return { d, x: gsap.quickTo(el, 'x', { duration: 1.6, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.6, ease: 'power3' }) };
    }).filter(Boolean);
    addEventListener('mousemove', e => {
      const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
      layers.forEach(l => { l.x(dx * l.d); l.y(dy * l.d); });
    }, { passive: true });
  }

  // Scroll-out: headline lines part, chart rises, glass lifts away
  const hero = document.querySelector('.hero4');
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } });
  heroTl
    .to('.kline:not(.kline-em)', { xPercent: -8, ease: 'none' }, 0)
    .to('.kline-em', { xPercent: 6, ease: 'none' }, 0)
    .to('.hero4-row, .hero4-tag', { opacity: 0, y: -40, ease: 'none' }, 0)
    .to('.hero4-scroll', { opacity: 0, ease: 'none' }, 0)
    .fromTo('.chart', { '--sy': '0px' }, { '--sy': '-120px', ease: 'none' }, 0);
  glass.forEach((g, i) => heroTl.fromTo(g, { '--sy': '0px' }, { '--sy': (-180 - i * 90) + 'px', ease: 'none' }, 0));

  /* ---------- Particle field: drifting emerald dust that links up and reacts to the cursor ---------- */
  const cvs = document.querySelector('.dust');
  if (cvs) {
    const ctx = cvs.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0, pts = [], running = true;
    const mouse = { x: -9999, y: -9999 };
    const size = () => {
      const r = cvs.getBoundingClientRect(); W = r.width; H = r.height;
      cvs.width = W * dpr; cvs.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(140, (W * H) / (fine ? 9000 : 16000)));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: -0.15 - Math.random() * 0.35, r: Math.random() * 1.8 + 0.6, a: Math.random() * 0.5 + 0.4 }));
    };
    size(); addEventListener('resize', size);
    hero.addEventListener('mousemove', e => {
      const r = cvs.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      hero.style.setProperty('--mx', mouse.x + 'px'); hero.style.setProperty('--my', mouse.y + 'px');
    });
    hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(es => { running = es[0].isIntersecting; }).observe(hero);
    const LINK = fine ? 120 : 80;
    gsap.ticker.add(() => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { const f = (22000 - d2) / 22000 * 0.9; p.x += dx * f * 0.04; p.y += dy * f * 0.04; }
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      }
      if (fine) for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < LINK) { ctx.strokeStyle = `rgba(46,232,154,${(1 - d / LINK) * 0.32})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const p of pts) {
        const near = Math.hypot(p.x - mouse.x, p.y - mouse.y) < 160;
        ctx.fillStyle = near ? 'rgba(124,243,192,.95)' : `rgba(124,243,192,${p.a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, near ? p.r + 1 : p.r, 0, Math.PI * 2); ctx.fill();
      }
    });
    gsap.from(cvs, { opacity: 0, duration: 2, delay: introDelay + 0.3 });
  }

  /* ================= LIT PARAGRAPH ================= */
  const lit = document.querySelector('.lit-text');
  if (lit) {
    const words = splitWords(lit, 'lw');
    gsap.to(words, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: lit, start: 'top 78%', end: 'bottom 50%', scrub: true }
    });
    gsap.from('.lit-face', { scale: 0, rotation: -90, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: lit, start: 'top 80%', toggleActions: 'play none none none' } });
  }

  /* ================= SECTION TITLES ================= */
  document.querySelectorAll('.split').forEach(h => {
    const w = splitWords(h, 'sw', 'swi');
    gsap.from(w, { yPercent: 115, rotation: 6, duration: 1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none none' } });
  });
  gsap.utils.toArray('.v4-label').forEach(l => gsap.from(l, { opacity: 0, x: -20, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: l, start: 'top 90%', toggleActions: 'play none none none' } }));

  /* ================= NUMBERS ================= */
  const count = el => {
    const to = +el.dataset.to; const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
  };
  const drawSpark = (p, st) => {
    const pl = p.querySelector('.num-spark polyline'); if (!pl) return;
    const L = pl.getTotalLength(); gsap.set(pl, { strokeDasharray: L, strokeDashoffset: L });
    gsap.to(pl, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: st });
  };
  const nums = document.querySelector('.nums');
  const track = document.querySelector('.nums-track');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 721px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const scrollTween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: nums, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    gsap.utils.toArray('.num-panel').forEach(p => {
      ScrollTrigger.create({ trigger: p, containerAnimation: scrollTween, start: 'left 85%', once: true, onEnter: () => count(p.querySelector('b')) });
      drawSpark(p, { trigger: p, containerAnimation: scrollTween, start: 'left 80%', toggleActions: 'play none none none' });
    });
  });
  mm.add('(max-width: 720px)', () => {
    gsap.utils.toArray('.num-panel').forEach(p => {
      ScrollTrigger.create({ trigger: p, start: 'top 85%', once: true, onEnter: () => count(p.querySelector('b')) });
      drawSpark(p, { trigger: p, start: 'top 85%', toggleActions: 'play none none none' });
      gsap.from(p, { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 90%', toggleActions: 'play none none none' } });
    });
  });

  /* ================= SERVICES ================= */
  gsap.utils.toArray('.svc4-row').forEach(r => {
    const strokes = r.querySelectorAll('.svc-ico svg > *');
    strokes.forEach(el => { const L = el.getTotalLength ? el.getTotalLength() : 100; gsap.set(el, { strokeDasharray: L, strokeDashoffset: L }); });
    const tl = gsap.timeline({ scrollTrigger: { trigger: r, start: 'top 82%', toggleActions: 'play none none none' } });
    tl.from(r.querySelector('.svc-ico'), { scale: 0.6, opacity: 0, duration: 1.1, ease: 'expo.out' })
      .to(strokes, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 }, 0.2)
      .from(r.querySelectorAll('h3, p, .chips span'), { y: 36, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }, 0.1);
  });

  /* ================= PROOF: stacked screenshots ================= */
  const cards = gsap.utils.toArray('.proof-card');
  mm.add('(min-width: 721px)', () => {
    gsap.set(cards.slice(1), { y: () => innerHeight });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.proof-pin', start: 'top top', end: '+=' + (cards.length * 90) + '%', pin: true, scrub: 1, anticipatePin: 1 } });
    cards.forEach((c, i) => {
      if (!i) return;
      tl.to(c, { y: 0, ease: 'power2.inOut', duration: 1 }, i - 1)
        .to(cards.slice(0, i), { scale: k => 1 - (i - k) * 0.05, yPercent: k => -(i - k) * 5, filter: 'brightness(.55)', ease: 'power2.inOut', duration: 1 }, i - 1);
    });
    tl.to({}, { duration: 0.4 });
  });
  mm.add('(max-width: 720px)', () => {
    cards.forEach(c => gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%', toggleActions: 'play none none none' } }));
  });

  /* ================= CASES ================= */
  gsap.utils.toArray('.case4-card').forEach((c, i) => {
    gsap.from(c, { y: 140, rotation: i ? 4 : -4, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 92%', toggleActions: 'play none none none' } });
    const img = c.querySelector('.case4-img img');
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ================= MARQUEES: speed up with scroll velocity ================= */
  const tracks = [...document.querySelectorAll('.mq-track, .chan4-track')];
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const boost = 1 + Math.min(5, Math.abs(self.getVelocity()) / 400);
      tracks.forEach(t => t.getAnimations().forEach(a => { a.playbackRate = boost; }));
    }
  });

  /* ================= BOOK ================= */
  gsap.from('.book4-cal, .book4-side > *', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.book4-grid', start: 'top 85%', toggleActions: 'play none none none' } });

  /* ================= FOOTER ================= */
  const fb = document.querySelector('.foot4-big');
  if (fb) {
    const fc = splitChars(fb);
    gsap.from(fc, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: fb, start: 'top 95%', toggleActions: 'play none none none' } });
    hoverHop(fc);
  }

  /* ---------- Magnetic CTA ---------- */
  if (fine) document.querySelectorAll('.magnetic').forEach(el => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('mouseleave', () => { x(0); y(0); });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
