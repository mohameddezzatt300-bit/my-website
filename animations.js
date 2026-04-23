/* =========================================================
   Portfolio animations — pure vanilla JS
   ========================================================= */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- 1. Scroll progress bar -----
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const updateBar = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  // ----- 2. Cursor spotlight -----
  if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
    const spot = document.createElement('div');
    spot.className = 'cursor-spot';
    document.body.appendChild(spot);
    let tx = window.innerWidth/2, ty = window.innerHeight/2;
    let cx = tx, cy = ty;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      spot.classList.add('on');
    });
    document.addEventListener('mouseleave', () => spot.classList.remove('on'));
    (function tick(){
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      spot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    })();
  }

  // ----- 3. Scroll-reveal via IntersectionObserver -----
  const autoTargets = [
    '.section-head',
    '.section-head > div',
    '.section-head > p',
    '.stats',
    '.services-grid',
    '.cases',
    '.case',
    '.platforms-row',
    '.logo-carousel',
    '.contact-grid',
    '.contact-block',
    '.footer-big',
    '.hero-side',
    '.marquee',
    '.case-hero',
    '.case-hero-visual',
    '.case-section',
    '.case-section-grid',
    '.bullet',
    '.results-grid',
    '.result',
    '.screens',
    '.screen',
    '.case-footer-cta',
    '.next-case',
  ];
  document.querySelectorAll(autoTargets.join(',')).forEach((el) => {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });

  // Add stagger to common lists
  document.querySelectorAll('.services-grid, .platforms-row, .hero-side, .case-metrics, .bullet-list, .results-grid, .cases').forEach(el => {
    el.setAttribute('data-stagger', '');
  });
  // Stats also stagger
  const stats = document.querySelector('.stats');
  if (stats) stats.setAttribute('data-stagger','');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, [data-stagger], .stat, .section-label').forEach(el => io.observe(el));

  // ----- 4. Split hero h1 into words for stagger reveal -----
  const heroH1 = document.querySelector('.hero h1');
  if (heroH1 && !reduceMotion) {
    // Walk text nodes and wrap words
    const walk = (node) => {
      if (node.nodeType === 3) {
        const txt = node.textContent;
        if (!txt.trim()) return;
        const frag = document.createDocumentFragment();
        const parts = txt.split(/(\s+)/);
        parts.forEach(p => {
          if (/^\s+$/.test(p)) {
            frag.appendChild(document.createTextNode(p));
          } else if (p.length) {
            const w = document.createElement('span');
            w.className = 'word';
            const inner = document.createElement('span');
            inner.textContent = p;
            w.appendChild(inner);
            frag.appendChild(w);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        // recurse into element, but treat its text content's words — keep element (e.g. .ital)
        // Wrap the element itself as a word if it contains only text
        const hasOnlyText = [...node.childNodes].every(c => c.nodeType === 3);
        if (hasOnlyText && node.textContent.trim()) {
          const w = document.createElement('span');
          w.className = 'word';
          const parent = node.parentNode;
          parent.insertBefore(w, node);
          w.appendChild(node);
        } else {
          [...node.childNodes].forEach(walk);
        }
      }
    };
    [...heroH1.childNodes].forEach(walk);
    // Apply stagger delays
    const words = heroH1.querySelectorAll('.word > span, .word');
    let i = 0;
    heroH1.querySelectorAll('.word').forEach((w) => {
      const inner = w.firstElementChild || w;
      if (inner.tagName === 'SPAN') {
        inner.style.animationDelay = (i * 60) + 'ms';
      }
      i++;
    });
  }

  // ----- 5. Stat number count-up -----
  const parseNum = (txt) => {
    const m = txt.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  };
  document.querySelectorAll('.stat .num, .case-metric .num, .result .num, .hero-side-row .v.big').forEach(el => {
    const txt = el.textContent;
    const target = parseNum(txt);
    if (target === null) return;
    el.dataset.target = target;
    el.dataset.original = txt;
  });

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.target);
      const original = el.dataset.original;
      if (isNaN(target)) { countObserver.unobserve(el); return; }

      const suffix = original.split(/[\d.]+/).slice(-1)[0] || '';
      const prefix = original.match(/^[^\d.]*/)[0] || '';
      const duration = 1400;
      const start = performance.now();
      const isInt = Number.isInteger(target);

      // Preserve inner markup (e.g. .unit spans) — only animate the leading number
      const nativeHTML = el.innerHTML;
      const numPartMatch = nativeHTML.match(/^([^<]*?)([\d.]+)/);
      if (!numPartMatch) { countObserver.unobserve(el); return; }
      const before = numPartMatch[1];
      const after = nativeHTML.substring(numPartMatch[0].length);

      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const v = target * ease(t);
        const display = isInt ? Math.round(v) : v.toFixed(1);
        el.innerHTML = before + display + after;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.stat .num, .case-metric .num, .result .num, .hero-side-row .v.big').forEach(el => {
    if (el.dataset.target !== undefined) countObserver.observe(el);
  });

  // ----- 6. Magnetic buttons + nav cta -----
  if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.btn, .nav-cta, .cal-slot.book').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width/2) / r.width;
        const dy = (e.clientY - r.top - r.height/2) / r.height;
        el.style.transform = `translate(${dx*8}px, ${dy*8}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ----- 7. Service card mouse-position spotlight -----
  document.querySelectorAll('.service, .case-visual').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
  });

  // ----- 8. Case cards tilt on hover -----
  if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.case').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width/2) / r.width;
        const dy = (e.clientY - r.top - r.height/2) / r.height;
        el.style.transform = `translateY(-3px) perspective(1200px) rotateX(${-dy*2}deg) rotateY(${dx*2}deg)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ----- 9. Hero side card parallax on scroll -----
  const heroSide = document.querySelector('.hero-side');
  if (heroSide && !reduceMotion) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 800) {
        heroSide.style.transform = `translateY(${y * 0.08}px)`;
      }
    }, { passive: true });
  }

  // ----- 10. Nav hide/show on scroll + scrolled class -----
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 80) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
      if (y > lastY && y > 200) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastY = y;
    }, { passive: true });
  }

  // ----- 11. Section labels — letter-by-letter reveal -----
  document.querySelectorAll('.section-label').forEach(el => {
    // Only split leaf text; preserve existing structure
    const txt = el.textContent;
    el.textContent = '';
    [...txt].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      s.style.transitionDelay = (i * 18) + 'ms';
      el.appendChild(s);
    });
  });

  // ----- 12. Smooth in-page anchor scrolling -----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // ----- 13. Image lazy fade -----
  document.querySelectorAll('.logo-cell img').forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 600ms';
    if (img.complete) img.style.opacity = '1';
    else img.addEventListener('load', () => { img.style.opacity = '1'; });
  });

})();
