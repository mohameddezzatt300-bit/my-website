/* =========================================================
   v4 case study motion — GSAP + ScrollTrigger + Lenis
   ========================================================= */
(function () {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- Lightbox for result screenshots (no GSAP needed) ---------- */
  const lb = document.createElement('div');
  lb.className = 'cs-lb';
  lb.innerHTML = '<button class="cs-lb-x" aria-label="Close">✕</button><img alt="">';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');
  const closeLb = () => { lb.classList.remove('open'); window.__lenis && window.__lenis.start(); };
  document.querySelectorAll('.proof-card img').forEach(img => img.closest('.proof-card').addEventListener('click', () => {
    lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add('open'); window.__lenis && window.__lenis.stop();
  }));
  lb.addEventListener('click', closeLb);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  /* ---------- Sticky CTA / WhatsApp visibility ---------- */
  const sticky = document.querySelector('.v4-sticky');
  const wa = document.querySelector('.v4-wa');
  const upd = () => { const past = scrollY > innerHeight * 0.6; sticky && sticky.classList.toggle('show', past); wa && wa.classList.toggle('show', past); };
  addEventListener('scroll', upd, { passive: true }); upd();

  if (!window.gsap || !window.ScrollTrigger || reduce) { html.classList.remove('js'); return; }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (window.Lenis && fine) {
    const lenis = new window.Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4) });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Split words ---------- */
  const splitWords = el => {
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          const o = document.createElement('span'); o.className = 'sw';
          const i = document.createElement('span'); i.className = 'swi'; i.textContent = w;
          o.appendChild(i); frag.appendChild(o); out.push(i);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
    return out;
  };
  const play = trigger => ({ trigger, start: 'top 86%', toggleActions: 'play none none none' });

  /* ---------- Hero ---------- */
  const title = document.querySelector('.cs-title');
  const tw = splitWords(title);
  gsap.set(title, { visibility: 'visible' });
  gsap.timeline({ defaults: { ease: 'expo.out' }, delay: html.classList.contains('pt-in') ? 0.6 : 0.1 })
    .from('.cs-back', { x: -20, opacity: 0, duration: 1 }, 0)
    .from('.cs-hero .v4-label', { opacity: 0, x: -20, duration: 1 }, 0.05)
    .from(tw, { yPercent: 115, duration: 1.3, stagger: 0.05 }, 0.1)
    .from('.cs-meta div', { y: 24, opacity: 0, duration: 1, stagger: 0.06 }, 0.5)
    .from('.cs-lede', { y: 24, opacity: 0, duration: 1.1 }, 0.7)
    .fromTo('.cs-visual-frame', { clipPath: 'inset(18% 12% 0% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.8, ease: 'expo.inOut' }, 0.6)
    .from('.cs-visual-frame img', { scale: 1.25, duration: 2.2, ease: 'expo.out' }, 0.6);
  gsap.fromTo('.cs-visual-frame img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.cs-visual-frame', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Section headings + labels ---------- */
  document.querySelectorAll('.split').forEach(h => {
    gsap.from(splitWords(h), { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.06, scrollTrigger: play(h) });
  });
  gsap.utils.toArray('.v4-label').forEach(l => { if (!l.closest('.cs-hero')) gsap.from(l, { opacity: 0, x: -20, duration: 0.9, ease: 'power3.out', scrollTrigger: play(l) }); });

  /* ---------- KPIs count up ---------- */
  gsap.utils.toArray('.cs-kpi').forEach((k, i) => {
    const b = k.querySelector('b'); const to = parseFloat(b.dataset.to); const dec = (b.dataset.to.split('.')[1] || '').length;
    const o = { v: 0 };
    gsap.timeline({ scrollTrigger: play(k) })
      .from(k, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', delay: i * 0.08 })
      .to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { b.textContent = o.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); } }, '<0.1');
  });

  /* ---------- Chapters: items reveal, progress bar fills ---------- */
  gsap.utils.toArray('.cs-ch').forEach(ch => {
    const items = ch.querySelectorAll('.cs-item');
    const bar = ch.querySelector('.cs-ch-progress i');
    const cur = ch.querySelector('.cs-ch-count b');
    items.forEach((it, i) => {
      gsap.from(it.children, { y: 36, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: play(it) });
      ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 60%', onToggle: s => { if (s.isActive && cur) cur.textContent = String(i + 1).padStart(2, '0'); } });
    });
    if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: ch.querySelector('.cs-items'), start: 'top 60%', end: 'bottom 60%', scrub: true } });
  });

  /* ---------- Results: stacked screenshots (desktop pinned) ---------- */
  const cards = gsap.utils.toArray('.proof-card');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 721px)', () => {
    if (cards.length < 2) return;
    gsap.set(cards.slice(1), { y: () => innerHeight });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.proof-pin', start: 'top top', end: '+=' + (cards.length * 80) + '%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true } });
    cards.forEach((c, i) => {
      if (!i) return;
      tl.to(c, { y: 0, ease: 'power2.inOut', duration: 1 }, i - 1)
        .to(cards.slice(0, i), { scale: k => 1 - (i - k) * 0.05, yPercent: k => -(i - k) * 5, filter: 'brightness(.55)', ease: 'power2.inOut', duration: 1 }, i - 1);
    });
    tl.to({}, { duration: 0.4 });
  });
  mm.add('(max-width: 720px)', () => {
    cards.forEach(c => gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: play(c) }));
  });

  /* ---------- CTA + next case ---------- */
  gsap.from('.cs-cta .v4-cta', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: play('.cs-cta') });
  gsap.from('.cs-next-t', { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: play('.cs-next') });

  // Magnetic CTA
  if (fine) document.querySelectorAll('.magnetic').forEach(el => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('mouseleave', () => { x(0); y(0); });
  });

  // Next-case image follows the cursor
  const next = document.querySelector('.cs-next'), nimg = document.querySelector('.cs-next-img');
  if (next && nimg && fine) {
    const nx = gsap.quickTo(nimg, 'x', { duration: 0.8, ease: 'power3' }), ny = gsap.quickTo(nimg, 'y', { duration: 0.8, ease: 'power3' });
    next.addEventListener('mousemove', e => { const r = next.getBoundingClientRect(); nx((e.clientX - r.left - r.width * 0.7) * 0.4); ny((e.clientY - r.top - r.height / 2) * 0.4); });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
