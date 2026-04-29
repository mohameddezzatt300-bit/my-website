/* =========================================================
   v2 animations — scroll-driven, vanilla JS
   ========================================================= */

/* ── Intro overlay — text scramble ── */
(function(){
  sessionStorage.removeItem('intro_done');
  if (sessionStorage.getItem('intro_done')) return;

  const TARGET  = 'M·EZZAT';
  const CHARS   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·#@%&';
  const rand    = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  // build spans
  const logoEl = document.createElement('div');
  logoEl.className = 'intro-logo';
  const spans = TARGET.split('').map(() => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = rand();
    logoEl.appendChild(s);
    return s;
  });

  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.appendChild(logoEl);
  document.body.appendChild(intro);
  document.body.style.overflow = 'hidden';

  // scramble loop — resolve chars one by one
  let resolved = 0;
  const interval = 40; // ms between frame updates
  const lockDelay = 120; // ms between each char locking

  const tick = setInterval(() => {
    spans.forEach((s, i) => {
      if (i >= resolved) {
        s.textContent = rand();
        s.classList.add('scrambling');
      }
    });
  }, interval);

  TARGET.split('').forEach((char, i) => {
    setTimeout(() => {
      spans[i].textContent = char;
      spans[i].classList.remove('scrambling');
      spans[i].classList.add('locked');
      resolved = i + 1;
      if (resolved === TARGET.length) {
        clearInterval(tick);
        // hold then exit
        setTimeout(() => {
          intro.classList.add('exit');
          setTimeout(() => {
            intro.classList.add('gone');
            document.body.style.overflow = '';
            setTimeout(() => {
              intro.remove();
              sessionStorage.setItem('intro_done', '1');
            }, 850);
          }, 620);
        }, 500);
      }
    }, 300 + i * lockDelay);
  });
})();

(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverable = window.matchMedia('(hover:hover)').matches;

  // Scroll progress bar
  const bar = document.createElement('div');
  bar.className = 'scroll-bar';
  document.body.appendChild(bar);
  const updBar = () => {
    const h = document.documentElement;
    const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  };
  window.addEventListener('scroll', updBar, { passive: true });
  updBar();

  // Cursor spotlight
  if (!reduce && hoverable) {
    const spot = document.createElement('div');
    spot.className = 'cursor-spot';
    document.body.appendChild(spot);
    let tx = innerWidth/2, ty = innerHeight/2, cx = tx, cy = ty;
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      spot.classList.add('on');
    });
    document.addEventListener('mouseleave', () => spot.classList.remove('on'));
    (function tick(){
      cx += (tx-cx)*0.14; cy += (ty-cy)*0.14;
      spot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    })();
  }

  // Scroll-reveal
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv, [data-stg], .stat').forEach(el => io.observe(el));

  // Hero headline word reveal
  const h1 = document.querySelector('.hero h1');
  if (h1 && !reduce) {
    h1.querySelectorAll('.line > span').forEach((s, i) => {
      s.style.transition = 'transform 900ms cubic-bezier(.2,.7,.2,1)';
      s.style.transitionDelay = (200 + i*90) + 'ms';
      requestAnimationFrame(() => { s.style.transform = 'translateY(0)'; });
    });
    const ar = h1.querySelector('.ar-line');
    if (ar) {
      ar.style.opacity = '0';
      ar.style.transform = 'translateY(20px)';
      ar.style.transition = 'opacity 800ms, transform 800ms';
      ar.style.transitionDelay = '700ms';
      requestAnimationFrame(() => {
        ar.style.opacity = '';
        ar.style.transform = '';
      });
    }
  }

  // Number count-up
  const parseNum = t => { const m = t.match(/([\d.]+)/); return m ? parseFloat(m[1]) : null; };
  const countObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const html = el.dataset.html;
      const target = parseFloat(el.dataset.target);
      if (isNaN(target)) { countObs.unobserve(el); return; }
      const numMatch = html.match(/^([^<]*?)([\d.]+)/);
      if (!numMatch) { countObs.unobserve(el); return; }
      const before = numMatch[1];
      const after = html.substring(numMatch[0].length);
      const isInt = Number.isInteger(target);
      const duration = 1600;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1-t, 3);
      const step = now => {
        const t = Math.min(1, (now-start)/duration);
        const v = target * ease(t);
        el.innerHTML = before + (isInt ? Math.round(v) : v.toFixed(1)) + after;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach(el => {
    const html = el.innerHTML;
    const n = parseNum(el.textContent);
    if (n === null) return;
    el.dataset.html = html;
    el.dataset.target = n;
    countObs.observe(el);
  });

  // Stat mini-chart — random-height bars animating when in view
  document.querySelectorAll('.stat').forEach(stat => {
    const chart = stat.querySelector('.chart');
    if (!chart) return;
    const bars = chart.querySelectorAll('span');
    bars.forEach(b => { b.style.height = '0%'; b.style.transitionDelay = (Math.random()*600) + 'ms'; });
    const startChart = () => {
      bars.forEach((b,i) => {
        const target = 30 + Math.random()*70;
        b.style.height = target + '%';
      });
    };
    const oneIO = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting) { setTimeout(startChart, 200); oneIO.unobserve(stat); }
      });
    }, { threshold: 0.3 });
    oneIO.observe(stat);
  });

  // Magnetic buttons
  if (!reduce && hoverable) {
    document.querySelectorAll('.btn, .nav a.cta').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX-r.left-r.width/2)/r.width;
        const dy = (e.clientY-r.top-r.height/2)/r.height;
        el.style.transform = `translate(${dx*8}px, ${dy*8}px)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
  }

  // Service/channel/case mouse spotlight
  document.querySelectorAll('.svc, .channel, .case').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX-r.left)/r.width)*100 + '%');
      el.style.setProperty('--my', ((e.clientY-r.top)/r.height)*100 + '%');
    });
  });

  // Case tilt
  if (!reduce && hoverable) {
    document.querySelectorAll('.case').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX-r.left-r.width/2)/r.width;
        const dy = (e.clientY-r.top-r.height/2)/r.height;
        el.style.transform = `perspective(1200px) rotateX(${-dy*1.5}deg) rotateY(${dx*1.5}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
  }

  // Nav hide on scroll down
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > lastY && y > 200) nav.classList.add('hidden');
      else nav.classList.remove('hidden');
      lastY = y;
    }, { passive: true });
  }

  // Hero portrait parallax
  const portrait = document.querySelector('.hero-portrait');
  if (portrait && !reduce) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 1000) {
        const inner = portrait.querySelector('.bg-img');
        if (inner) inner.style.transform = `translateY(${y*0.1}px) scale(1.05)`;
      }
    }, { passive: true });
  }

  // Live-stats ticker: cycle values every 4s
  const liveStats = document.querySelector('.live-stats');
  if (liveStats && !reduce) {
    const rows = liveStats.querySelectorAll('.live-stats-row b');
    const cycles = [
      ['8.4x','9.1x','10.2x','11.6x','9.7x'],
      ['142k','156k','171k','164k','189k'],
      ['28%','31%','34%','36%','33%']
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx+1) % 5;
      rows.forEach((r, i) => {
        if (cycles[i]) {
          r.style.opacity = '0.3';
          setTimeout(() => {
            r.textContent = cycles[i][idx];
            r.style.opacity = '1';
          }, 180);
        }
      });
    }, 3200);
  }

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 40, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // Lazy logo fade
  document.querySelectorAll('.logo-cell img').forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 600ms';
    if (img.complete) img.style.opacity = '1';
    else img.addEventListener('load', () => img.style.opacity = '1');
  });

  // Build calendar
  const grid = document.getElementById('cal-grid');
  if (grid) {
    const dows = ['S','M','T','W','T','F','S'];
    let html = dows.map(d => `<div class="dow">${d}</div>`).join('');
    const startOffset = 5, days = 31;
    for (let i = 0; i < startOffset; i++) html += `<div class="day off"></div>`;
    for (let d = 1; d <= days; d++) {
      const dow = (startOffset + d - 1) % 7;
      const weekend = dow === 5 || dow === 6;
      let cls = 'day';
      if (weekend || d < 4) cls += ' off';
      else cls += ' avail';
      if (d === 14) cls += ' selected';
      html += `<div class="${cls}">${d}</div>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.day.avail, .day.selected').forEach(el => {
      el.onclick = () => {
        grid.querySelectorAll('.day').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
      };
    });
    document.querySelectorAll('.cal-slot:not(.book)').forEach(s => {
      s.onclick = () => {
        document.querySelectorAll('.cal-slot:not(.book)').forEach(x => x.style.background = '');
        s.style.background = 'var(--brand)';
        s.style.color = '#fff';
      };
    });
  }

  // ========= TWEAKS =========
  const TWEAK = /*EDITMODE-BEGIN*/{
    "accent": "#14c27a",
    "theme": "dark",
    "direction": "agency-motion"
  }/*EDITMODE-END*/;

  const accents = {
    "#14c27a": { brand: "#034e33", bright: "#0a8a5c", glow: "#14c27a", accent: "#22d3a1" },
    "#3b82f6": { brand: "#0a2540", bright: "#1e4fa8", glow: "#3b82f6", accent: "#60a5fa" },
    "#e8a33a": { brand: "#3e2a0a", bright: "#a87010", glow: "#e8a33a", accent: "#f5c266" },
    "#e45858": { brand: "#4a1a1a", bright: "#b83838", glow: "#e45858", accent: "#ff7a7a" }
  };
  const applyAccent = (hex) => {
    const a = accents[hex];
    if (!a) return;
    const root = document.documentElement;
    root.style.setProperty('--brand', a.brand);
    root.style.setProperty('--brand-bright', a.bright);
    root.style.setProperty('--brand-glow', a.glow);
    root.style.setProperty('--accent', a.accent);
  };
  const applyTheme = (mode) => {
    document.documentElement.setAttribute('data-mode', mode);
  };
  const applyDirection = (dir) => {
    document.documentElement.setAttribute('data-dir', dir);
    // update classes that switch layouts
    const hero = document.querySelector('.hero');
    if (hero) hero.setAttribute('data-variant', dir);
  };

  applyAccent(TWEAK.accent);
  applyTheme(TWEAK.theme);
  applyDirection(TWEAK.direction);

  // Build tweaks panel
  const panel = document.getElementById('tweaks');
  if (panel) {
    panel.innerHTML = `
      <h5>Tweaks</h5>
      <div class="tw-sec">
        <div class="tw-lbl">Accent</div>
        <div class="tw-sw" id="tw-sw">
          ${Object.keys(accents).map(hex => `<div class="s ${hex===TWEAK.accent?'active':''}" data-hex="${hex}" style="background:${hex}"></div>`).join('')}
        </div>
      </div>
      <div class="tw-sec">
        <div class="tw-lbl">Theme</div>
        <div class="tw-row" id="tw-theme">
          <div class="tw-chip ${TWEAK.theme==='dark'?'active':''}" data-v="dark">Dark</div>
          <div class="tw-chip ${TWEAK.theme==='light'?'active':''}" data-v="light">Light</div>
        </div>
      </div>
      <div class="tw-sec">
        <div class="tw-lbl">Direction</div>
        <div class="tw-row" id="tw-dir">
          <div class="tw-chip ${TWEAK.direction==='agency-motion'?'active':''}" data-v="agency-motion">Agency motion</div>
          <div class="tw-chip ${TWEAK.direction==='swiss'?'active':''}" data-v="swiss">Swiss minimal</div>
          <div class="tw-chip ${TWEAK.direction==='terminal'?'active':''}" data-v="terminal">Terminal</div>
          <div class="tw-chip ${TWEAK.direction==='editorial'?'active':''}" data-v="editorial">Editorial</div>
        </div>
      </div>
    `;
    const send = (edits) => window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    panel.querySelector('#tw-sw').addEventListener('click', e => {
      const s = e.target.closest('.s'); if (!s) return;
      panel.querySelectorAll('#tw-sw .s').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      const hex = s.dataset.hex;
      applyAccent(hex);
      send({ accent: hex });
    });
    panel.querySelector('#tw-theme').addEventListener('click', e => {
      const c = e.target.closest('.tw-chip'); if (!c) return;
      panel.querySelectorAll('#tw-theme .tw-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      applyTheme(c.dataset.v);
      send({ theme: c.dataset.v });
    });
    panel.querySelector('#tw-dir').addEventListener('click', e => {
      const c = e.target.closest('.tw-chip'); if (!c) return;
      panel.querySelectorAll('#tw-dir .tw-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      applyDirection(c.dataset.v);
      send({ direction: c.dataset.v });
    });
  }

  // Logo carousel controls
  const carousel   = document.querySelector('.logo-carousel');
  const allTracks  = carousel?.querySelectorAll('.logo-track');
  const prevBtn    = document.getElementById('logoPrev');
  const pauseBtn   = document.getElementById('logoPause');
  const nextBtn    = document.getElementById('logoNext');
  let carouselPaused = false;

  const setCarouselPaused = (state) => {
    carouselPaused = state;
    allTracks?.forEach(t => { t.style.animationPlayState = state ? 'paused' : 'running'; });
    if (carousel) carousel.classList.toggle('user-control', state);
    if (pauseBtn) {
      pauseBtn.classList.toggle('paused', state);
      const iPause = pauseBtn.querySelector('.ico-pause');
      const iPlay  = pauseBtn.querySelector('.ico-play');
      if (iPause) iPause.style.display = state ? 'none' : '';
      if (iPlay)  iPlay.style.display  = state ? '' : 'none';
    }
  };

  let resumeTimer;
  const tempPause = () => {
    setCarouselPaused(true);
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => setCarouselPaused(false), 4000);
  };

  prevBtn?.addEventListener('click', () => {
    tempPause();
    carousel?.scrollBy({ left: -280, behavior: 'smooth' });
  });
  nextBtn?.addEventListener('click', () => {
    tempPause();
    carousel?.scrollBy({ left: 280, behavior: 'smooth' });
  });
  pauseBtn?.addEventListener('click', () => {
    clearTimeout(resumeTimer);
    setCarouselPaused(!carouselPaused);
  });

  // Theme toggle (dark / light) with localStorage persistence
  const savedTheme = localStorage.getItem('me-theme');
  if (savedTheme) applyTheme(savedTheme);

  const syncToggles = (mode) => {
    [document.getElementById('themeToggle'), document.getElementById('themeToggleMobile')]
      .forEach(btn => { if (btn) btn.setAttribute('data-mode', mode); });
  };
  syncToggles(document.documentElement.getAttribute('data-mode') || 'dark');

  ['themeToggle', 'themeToggleMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-mode') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('me-theme', next);
      syncToggles(next);
    });
  });

  // Mobile drawer toggle
  const mToggle = document.getElementById('mobileNavToggle');
  const mDrawer = document.getElementById('mobileDrawer');
  if (mToggle && mDrawer) {
    const close = () => { mToggle.classList.remove('open'); mDrawer.classList.remove('open'); document.body.style.overflow = ''; };
    mToggle.addEventListener('click', () => {
      const open = mDrawer.classList.toggle('open');
      mToggle.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mDrawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  // Edit-mode protocol
  window.addEventListener('message', (e) => {
    if (e.data?.type === '__activate_edit_mode') panel?.classList.add('open');
    if (e.data?.type === '__deactivate_edit_mode') panel?.classList.remove('open');
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');

  // ========= HERO ENTRY SEQUENCE =========
  if (!reduce) {
    const mobile = window.matchMedia('(max-width: 720px)').matches;
    [
      ['.hero-eyebrow',  100, 'Y', 20],
      ['.hero-sub',      560, 'Y', 20],
      ['.hero-cta',      730, 'Y', 20],
      ['.hero-portrait', mobile ? 380 : 180, mobile ? 'Y' : 'X', mobile ? 24 : 32],
    ].forEach(([sel, delay, axis, dist]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = `translate${axis}(${dist}px)`;
      el.style.willChange = 'opacity, transform';
      el.style.transition = `opacity 900ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 900ms cubic-bezier(.2,.7,.2,1) ${delay}ms`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.opacity = '';
        el.style.transform = '';
      }));
    });
  }

  // ========= MOUSE SPOTLIGHT — testi + contact =========
  document.querySelectorAll('.testi-card, .contact-block').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  // ========= STARS POP ANIMATION =========
  const starObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const starsEl = e.target.querySelector('.testi-stars');
      if (!starsEl) return;
      const chars = [...starsEl.textContent];
      starsEl.innerHTML = chars.map(c => `<span class="star">${c}</span>`).join('');
      starsEl.querySelectorAll('.star').forEach((s, i) => {
        setTimeout(() => s.classList.add('popped'), i * 90 + 80);
      });
      starObs.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.testi-card').forEach(c => starObs.observe(c));

  // ========= NUMBER GLOW AFTER COUNT-UP =========
  if (!reduce) {
    const glowObs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const num = e.target.querySelector('.num');
        if (num) setTimeout(() => num.classList.add('counted'), 1800);
        glowObs.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat').forEach(s => glowObs.observe(s));
  }

  // ========= GLITCH — nav brand =========
  if (!reduce) {
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
      const dot = navBrand.querySelector('.dot');
      const glitch = document.createElement('span');
      glitch.className = 'brand-glitch';
      glitch.setAttribute('data-text', 'M·EZZAT');
      glitch.textContent = 'M·EZZAT';
      navBrand.innerHTML = '';
      if (dot) navBrand.appendChild(dot);
      navBrand.appendChild(glitch);
    }
  }

  // ========= LIGHTBOX =========
  const screenImgs = [...document.querySelectorAll('.screen img')];
  if (screenImgs.length) {
    let current = 0;

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <span class="lightbox-close">✕</span>
      <span class="lightbox-prev">‹</span>
      <img>
      <span class="lightbox-next">›</span>
      <span class="lightbox-counter"></span>
    `;
    document.body.appendChild(lb);
    const lbImg = lb.querySelector('img');
    const counter = lb.querySelector('.lightbox-counter');

    const showImg = idx => {
      current = (idx + screenImgs.length) % screenImgs.length;
      lbImg.src = screenImgs[current].src;
      counter.textContent = (current + 1) + ' / ' + screenImgs.length;
      // hide arrows if only one image
      lb.querySelector('.lightbox-prev').style.display = screenImgs.length < 2 ? 'none' : '';
      lb.querySelector('.lightbox-next').style.display = screenImgs.length < 2 ? 'none' : '';
    };

    const openLb = idx => {
      showImg(idx);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeLb = () => {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    };

    screenImgs.forEach((img, i) => img.addEventListener('click', () => openLb(i)));

    lb.querySelector('.lightbox-close').addEventListener('click', e => { e.stopPropagation(); closeLb(); });
    lb.querySelector('.lightbox-prev').addEventListener('click', e => { e.stopPropagation(); showImg(current - 1); });
    lb.querySelector('.lightbox-next').addEventListener('click', e => { e.stopPropagation(); showImg(current + 1); });

    // keyboard
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') showImg(current + 1);
      if (e.key === 'ArrowLeft')  showImg(current - 1);
    });

    // touch swipe
    let touchStartX = 0, touchStartY = 0, didSwipe = false;
    lb.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      didSwipe = false;
    }, { passive: true });
    lb.addEventListener('touchmove', e => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > dy && dx > 10) didSwipe = true;
    }, { passive: true });
    lb.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        didSwipe = true;
        showImg(diff > 0 ? current + 1 : current - 1);
      }
    });
    // prevent swipe from triggering close
    lb.addEventListener('click', e => { if (didSwipe) { didSwipe = false; return; } if (e.target === lb) closeLb(); });
  }

})();
