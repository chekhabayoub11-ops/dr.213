(() => {
  'use strict';

  // Clinic settings
  const CLINIC_WHATSAPP = '213555012345';
  const CLOSED_WEEKDAY = 5; // Friday
  const TIME_SLOTS = ['09:30', '11:00', '14:00', '16:30'];
  const DIVE_IMAGES = [
    ...Array.from({ length: 11 }, (_, i) => ({ src: `image/dive/diag-${String(i + 1).padStart(2, '0')}.jpg`, kind: 'diag' })),
    ...Array.from({ length: 12 }, (_, i) => ({ src: `image/dive/smile-${String(i + 1).padStart(2, '0')}.jpg`, kind: 'smile' })),
    { src: 'image/stock/implant.jpg', kind: 'smile' },
    { src: 'image/stock/aligner.jpg', kind: 'smile' },
    { src: 'image/stock/xray.jpg', kind: 'diag' },
    { src: 'image/stock/exam.jpg', kind: 'diag' },
    { src: 'image/stock/braces.jpg', kind: 'diag' },
    { src: 'image/stock/portrait-smile.jpg', kind: 'smile' },
  ];
  const KIND_LABEL = { diag: 'التشخيص', smile: 'الابتسامة' };

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const motion = !!gsap && !reduceMotion;

  window.__introStarted = true;
  if (!motion) root.classList.remove('js');

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Radio chip groups (dates / times) ---------- */
  function radioGroup(container, items) {
    container.innerHTML = '';
    const buttons = items.map((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.value = item.value;
      b.setAttribute('aria-label', item.label);
      b.innerHTML = item.html;
      b.addEventListener('click', () => select(i, true));
      container.appendChild(b);
      return b;
    });
    function select(i, focus) {
      buttons.forEach((b, j) => {
        b.setAttribute('aria-checked', String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      if (focus) buttons[i].focus();
      container.dataset.value = buttons[i].dataset.value;
    }
    container.addEventListener('keydown', (e) => {
      const keys = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 }; // RTL: left = next
      if (!(e.key in keys)) return;
      e.preventDefault();
      const cur = buttons.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      select((cur + keys[e.key] + buttons.length) % buttons.length, true);
    });
    select(0, false);
  }

  function upcomingDays(count) {
    const fmtWd = new Intl.DateTimeFormat('ar-DZ', { weekday: 'long' });
    const fmtFull = new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' });
    const days = [];
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    while (days.length < count) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === CLOSED_WEEKDAY) continue;
      days.push({
        value: d.toISOString().slice(0, 10),
        label: fmtFull.format(d),
        html: `<span class="d-wd">${fmtWd.format(d)}</span><span class="d-num">${d.getDate()}</span>`,
      });
    }
    return days;
  }

  $$('[data-dates]').forEach((el) => radioGroup(el, upcomingDays(+el.dataset.days || 4)));
  const timeEl = $('[data-times]');
  if (timeEl) radioGroup(timeEl, TIME_SLOTS.map((t) => ({ value: t, label: t, html: `<span dir="ltr">${t}</span>` })));

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    if (gsap) {
      ScrollTrigger && lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- Menu ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#mobile-menu');
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'فتح القائمة');
  }
  menuBtn && menuBtn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    if (open) $('a', menu).focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && !menu.hidden) { closeMenu(); menuBtn.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (menu && !menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
  });

  /* ---------- Anchor links ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (a.dataset.service) $('#f-service').value = a.dataset.service;
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: -90, duration: 1.6 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    if (id === '#book' && finePointer) setTimeout(() => $('#f-name').focus({ preventScroll: true }), lenis ? 1400 : 600);
  });

  /* ---------- Nav state, active link, scroll progress ---------- */
  const nav = $('.nav');
  const bar = $('.progress i');
  const talk = $('.talk');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
    talk && talk.classList.toggle('is-visible', window.scrollY > innerHeight * 0.7);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav-links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => {
        const on = a.getAttribute('href') === `#${e.target.id}`;
        a.classList.toggle('is-active', on);
        on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach((s) => sectionIO.observe(s));

  /* ---------- Mobile booking bar ---------- */
  const mobileCta = $('.mobile-cta');
  if (mobileCta) {
    const seen = new Map();
    const update = () => {
      const show = seen.get('ctas') === false && seen.get('book') === false;
      mobileCta.classList.toggle('is-visible', show);
      mobileCta.setAttribute('aria-hidden', String(!show));
      $$('a', mobileCta).forEach((a) => { a.tabIndex = show ? 0 : -1; });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.dataset.watch, e.isIntersecting));
      update();
    });
    const ctas = $('.hero-ctas');
    const book = $('#book');
    ctas.dataset.watch = 'ctas';
    book.dataset.watch = 'book';
    io.observe(ctas);
    io.observe(book);
  }

  /* ---------- Booking form → WhatsApp ---------- */
  const form = $('#book-form');
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = $('.form-status', form);
    const { name: nameEl, tel: telEl, service } = form.elements;
    const name = nameEl.value.trim();
    const tel = telEl.value.trim();
    const telOk = tel.replace(/\D/g, '').length >= 9;
    nameEl.setAttribute('aria-invalid', String(!name));
    telEl.setAttribute('aria-invalid', String(!telOk));
    if (!name || !telOk) {
      status.textContent = !name ? 'يرجى إدخال الاسم الكامل.' : 'يرجى إدخال رقم هاتف صحيح.';
      status.classList.add('is-error');
      (!name ? nameEl : telEl).focus();
      return;
    }
    const dayBtn = $('[data-dates="form"] [aria-checked="true"]');
    const msg = [
      'السلام عليكم، أودّ حجز موعد في عيادة د. يحيى.',
      `الاسم: ${name}`,
      `الهاتف: ${tel}`,
      `الخدمة: ${service.value}`,
      `اليوم: ${dayBtn ? dayBtn.getAttribute('aria-label') : ''}`,
      `الوقت: ${$('[data-times]').dataset.value}`,
    ].join('\n');
    status.classList.remove('is-error');
    status.textContent = 'جارٍ فتح واتساب لإرسال طلبك…';
    window.open(`https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  /* ---------- Team: 3D coverflow carousel ---------- */
  (() => {
    const stage = $('.team-stage');
    if (!stage) return;
    const items = $$('.member', stage);
    const prevBtn = $('[data-team-prev]');
    const nextBtn = $('[data-team-next]');
    const indexEl = $('[data-team-index]');
    const live = $('[data-team-live]');
    const pad = (n) => String(n).padStart(2, '0');
    const last = items.length - 1;
    let active = Math.max(0, items.findIndex((m) => m.classList.contains('is-lead')));
    let pos = active; // fractional while dragging

    $('[data-team-total]').textContent = pad(items.length);

    const gap = () => (innerWidth < 700 ? innerWidth * 0.5 : Math.min(innerWidth * 0.17, 270));
    function layout() {
      const g = gap();
      items.forEach((m, i) => {
        const d = i - pos;
        const ad = Math.abs(d);
        // RTL: following members sit to the left and turn to face the centre
        m.style.setProperty('--x', `${(-d * g).toFixed(1)}px`);
        m.style.setProperty('--z', `${(-Math.min(ad, 4) * 170).toFixed(1)}px`);
        m.style.setProperty('--ry', `${Math.max(-48, Math.min(48, d * 24)).toFixed(2)}deg`);
        m.style.setProperty('--s', (ad < 1 ? 1.1 - ad * 0.18 : Math.max(0.72, 0.92 - (ad - 1) * 0.08)).toFixed(3));
        m.style.setProperty('--o', ad > 3.4 ? '0' : '1');
        m.style.zIndex = String(100 - Math.round(ad * 10));
        m.classList.toggle('is-active', i === Math.round(pos));
      });
    }
    function go(i, announce = true) {
      active = Math.max(0, Math.min(last, i));
      pos = active;
      layout();
      indexEl.textContent = pad(active + 1);
      prevBtn.disabled = active === 0;
      nextBtn.disabled = active === last;
      if (announce) live.textContent = `${active + 1} من ${items.length}: ${items[active].getAttribute('aria-label')}`;
    }

    prevBtn.addEventListener('click', () => go(active - 1));
    nextBtn.addEventListener('click', () => go(active + 1));
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(active + 1); items[active].focus({ preventScroll: true }); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active - 1); items[active].focus({ preventScroll: true }); }
    });
    items.forEach((m, i) => {
      m.addEventListener('focus', () => { if (i !== active) go(i); });
      m.addEventListener('click', () => { if (!dragged && i !== active) go(i); });
    });

    // Horizontal trackpad swipe / shift+wheel — vertical wheel keeps scrolling the page
    let acc = 0;
    let cooldown = 0;
    stage.addEventListener('wheel', (e) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      acc += dx;
      if (now > cooldown && Math.abs(acc) > 40) {
        go(active + (acc > 0 ? -1 : 1));
        acc = 0;
        cooldown = now + 320;
      }
    }, { passive: false });

    // Drag with mouse or finger
    let startX = 0;
    let startPos = 0;
    let dragging = false;
    let dragged = false;
    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      dragged = false;
      startX = e.clientX;
      startPos = pos;
    });
    addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) < 6) return;
      if (!dragged) { dragged = true; stage.classList.add('is-dragging'); }
      let p = startPos + dx / gap(); // dragging right brings the left (next) member to the centre
      if (p < 0) p *= 0.35;
      if (p > last) p = last + (p - last) * 0.35;
      pos = p;
      layout();
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (dragged) go(Math.round(pos));
      setTimeout(() => { dragged = false; }, 0);
    };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
    addEventListener('resize', layout);

    go(active, false);
  })();

  /* ---------- Hero: Grid Dive ---------- */
  const dive = (() => {
    const hero = $('.dive');
    const world = $('.dive-world');
    if (!hero || !world) return { start() {} };
    const small = innerWidth < 700;
    const COUNT = small ? 18 : 34;
    const DEPTH = 3600;
    const NEAR = 620;
    const tiles = [];
    let W = hero.clientWidth;
    let H = hero.clientHeight;

    const spawn = (t) => {
      let x, y;
      do {
        x = (Math.random() * 2 - 1) * W * 0.8;
        y = (Math.random() * 2 - 1) * H * 0.75;
      } while (Math.abs(x) < W * 0.13 && Math.abs(y) < H * 0.13);
      t.x = x;
      t.y = y;
    };

    for (let i = 0; i < COUNT; i++) {
      const img = DIVE_IMAGES[i % DIVE_IMAGES.length];
      const el = document.createElement('div');
      el.className = `tile k-${img.kind}`;
      const w = Math.round((small ? 110 : 150) + Math.random() * (small ? 90 : 170));
      const h = Math.round(w * (0.68 + Math.random() * 0.5));
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.innerHTML = `<img src="${img.src}" alt="" decoding="async"><span class="tile-tag">${KIND_LABEL[img.kind]}</span>`;
      world.appendChild(el);
      const t = { el, w, h, z: -DEPTH + (i / COUNT) * (DEPTH + NEAR * 0.6) };
      spawn(t);
      tiles.push(t);
    }

    const P = 900; // matches .dive-stage perspective
    const render = () => {
      for (const t of tiles) {
        const fadeIn = Math.min(1, (t.z + DEPTH) / 700);
        const fadeOut = t.z > 220 ? Math.max(0, 1 - (t.z - 220) / (NEAR - 220)) : 1;
        // keep the name readable: tiles projected onto the centre block go faint
        const k = P / (P - Math.min(t.z, P - 1));
        const sx = Math.abs(t.x * k) - (t.w * k) / 2;
        const sy = Math.abs(t.y * k) - (t.h * k) / 2;
        const clear = sx < W * 0.24 && sy < H * 0.26 ? 0.12 : 1;
        t.el.style.opacity = (fadeIn * fadeOut * clear).toFixed(3);
        t.el.style.transform = `translate3d(${(t.x - t.w / 2).toFixed(1)}px, ${(t.y - t.h / 2).toFixed(1)}px, ${t.z.toFixed(1)}px)`;
      }
    };
    render();
    if (!motion) return { start() {} };

    let inView = true;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(hero);
    addEventListener('resize', () => { W = hero.clientWidth; H = hero.clientHeight; });

    let mx = 0, my = 0, cx = 0, cy = 0;
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
      });
      hero.addEventListener('pointerleave', () => { mx = 0; my = 0; });
    }

    let lastY = scrollY;
    let boost = 0;
    let running = false;
    const tick = (time, dt) => {
      if (!inView) return;
      const sec = Math.min(dt / 1000, 0.05);
      const dy = Math.abs(scrollY - lastY);
      lastY = scrollY;
      boost += (Math.min(dy * 40, 1400) - boost) * 0.08; // scrolling dives faster
      const speed = 110 + boost;
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      hero.style.setProperty('--po-x', `${50 + cx * 60}%`);
      hero.style.setProperty('--po-y', `${50 + cy * 60}%`);
      world.style.transform = `rotateY(${(cx * 10).toFixed(2)}deg) rotateX(${(-cy * 8).toFixed(2)}deg)`;
      for (const t of tiles) {
        t.z += speed * sec;
        if (t.z > NEAR) { t.z -= DEPTH + NEAR; spawn(t); }
      }
      render();
    };
    return {
      start() {
        if (running) return;
        running = true;
        gsap.ticker.add(tick);
      },
    };
  })();

  /* ---------- Clinic film: real footage when present, graded photo sequence otherwise ---------- */
  (() => {
    const screen = $('.screen');
    if (!screen) return;
    const video = $('.film-video', screen);
    const scenes = $$('.scene', screen);
    const progress = $('.film-progress', screen);
    progress.innerHTML = scenes.map(() => '<i><b></b></i>').join('');
    const fills = $$('b', progress);
    const toggle = $('.film-toggle', screen);
    const labelEl = $('[data-scene-label]', screen);
    const codeEl = $('[data-scene-code]', screen);
    const tcEl = $('[data-timecode]', screen);
    const SCENE = 5;
    let userPaused = reduceMotion;
    let inView = false;
    let usingVideo = false;
    let tl = null;
    let elapsed = 0;
    let last = 0;

    const setScene = (i) => {
      labelEl.textContent = scenes[i].dataset.label;
      codeEl.textContent = scenes[i].dataset.code;
    };

    if (gsap) {
      tl = gsap.timeline({ repeat: -1, paused: true });
      tl.set(fills, { scaleX: 0 }, 0);
      scenes.forEach((sc, i) => {
        const at = i * SCENE;
        const dir = i % 2 ? 1 : -1;
        const prev = scenes[(i - 1 + scenes.length) % scenes.length];
        tl.call(setScene, [i], at)
          .set(scenes, { zIndex: 0 }, at)
          .set(prev, { zIndex: 1 }, at)
          .set(sc, { zIndex: 2 }, at)
          .fromTo(sc, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: 'power2.inOut', immediateRender: false }, at)
          .fromTo($('img', sc), { scale: 1.18, xPercent: dir * 2.5 },
            { scale: 1.04, xPercent: -dir * 2.5, duration: i < scenes.length - 1 ? SCENE + 1.3 : SCENE, ease: 'none', immediateRender: false }, at)
          .fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: SCENE, ease: 'none', immediateRender: false }, at);
      });
      tl.time(1.3); // open on a fully visible first scene
    } else {
      toggle.hidden = true;
    }

    const running = () => !userPaused && inView;
    function sync() {
      const run = running();
      if (usingVideo) run ? video.play().catch(() => {}) : video.pause();
      else if (tl) run ? tl.play() : tl.pause();
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.setAttribute('aria-label', userPaused ? 'تشغيل الفيديو' : 'إيقاف الفيديو مؤقتاً');
    }
    toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) screen.classList.add('is-open');
      sync();
    }, { threshold: 0.35 }).observe(screen);

    const saveData = navigator.connection && navigator.connection.saveData;
    if (video && video.dataset.src && !saveData) {
      video.addEventListener('loadeddata', () => {
        usingVideo = true;
        screen.classList.add('has-video');
        tl && tl.pause();
        labelEl.textContent = 'مبنى العيادة';
        codeEl.textContent = 'SC.00';
        toggle.hidden = false;
        sync();
      }, { once: true });
      video.src = video.dataset.src;
      video.load();
    }

    const pad = (n) => String(n).padStart(2, '0');
    (function frame(t) {
      const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      if (running() && (usingVideo || tl)) {
        elapsed += dt;
        const sec = Math.floor(elapsed);
        tcEl.textContent = `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}:${pad(Math.floor((elapsed % 1) * 24))}`;
      }
      requestAnimationFrame(frame);
    })(0);
  })();

  if (!motion) return;

  /* =========================================================
     Motion (GSAP)
     ========================================================= */
  ScrollTrigger && gsap.registerPlugin(ScrollTrigger);

  // Split the hero name into masked characters
  $$('[data-split]').forEach((el) => {
    [...el.childNodes].forEach((node) => {
      if (node.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      [...node.textContent].forEach((c) => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        frag.appendChild(s);
      });
      el.replaceChild(frag, node);
    });
  });
  // Section titles rise out of a mask
  $$('[data-lines]').forEach((el) => { el.innerHTML = `<span class="ln"><span>${el.innerHTML}</span></span>`; });

  function countUp() {
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count;
      const dec = +el.dataset.decimals || 0;
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } });
    });
  }

  // Loader → intro
  const loaderNum = $('[data-loader]');
  const counter = { v: 0 };
  gsap.timeline()
    .to(counter, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { loaderNum.textContent = Math.round(counter.v); } })
    .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=0.1')
    .add(() => { $('.loader').style.display = 'none'; })
    .add(dive.start, '-=0.9')
    .fromTo('.dive-world', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 2, ease: 'expo.out' }, '-=0.9')
    .fromTo('.dive-name .ch, .dive-name .dr', { opacity: 1, yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.05 }, '-=1.7')
    .fromTo('[data-intro="hud"]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=1.1')
    .fromTo('[data-intro="nav"]', { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 1, ease: 'back.out(1.6)', clearProps: 'transform' }, '-=0.9')
    .add(countUp, '-=0.8');

  // Magnetic buttons
  if (finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Custom cursor
  const cursor = $('.cursor');
  if (finePointer && cursor) {
    const label = $('span', cursor);
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    addEventListener('pointermove', (e) => {
      cx(e.clientX);
      cy(e.clientY);
      const t = e.target instanceof Element ? e.target : null;
      const hot = t && t.closest('[data-cursor], .member, .svc-media, .bento .tile');
      label.textContent = hot ? (hot.dataset.cursor || (hot.classList.contains('member') ? 'اسحب' : 'عرض')) : '';
      cursor.classList.toggle('is-big', !!hot);
      cursor.classList.toggle('on-dark', !!(t && t.closest('.deck, .team, .footer, .marquee, .screen')));
    });
  }

  if (!ScrollTrigger) return;

  // Hero: the name drifts back as you scroll away
  gsap.to('.dive-center', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.dive', start: 'top top', end: 'bottom top', scrub: true } });

  // Services deck: pinned, scrolling walks the cards through 3D space.
  // Only transform/opacity (+ a dimming overlay) animate, scrub follows Lenis directly, no snap — smooth both ways.
  const deck = $('.deck');
  const cards = $$('.svc', deck);
  const dotsNav = $('.deck-dots', deck);
  gsap.matchMedia().add('(min-width: 1101px)', () => {
    deck.classList.add('is-pinned');
    const vw = () => innerWidth;
    const vh = () => innerHeight;
    const S = {
      active: { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, '--dim': 0 },
      next: { x: () => vw() * 0.36, y: () => vh() * 0.34, rotation: -7, scale: 0.5, opacity: 0.9, '--dim': 0.45 },
      past: { x: () => -vw() * 0.36, y: () => -vh() * 0.3, rotation: 6, scale: 0.48, opacity: 0.6, '--dim': 0.6 },
      gone: { x: () => -vw() * 0.6, y: () => -vh() * 0.7, rotation: 10, scale: 0.4, opacity: 0, '--dim': 0.7 },
      wait: { x: () => vw() * 0.6, y: () => vh() * 0.75, rotation: -10, scale: 0.4, opacity: 0, '--dim': 0.7 },
    };
    cards.forEach((c, i) => gsap.set(c, { ...(i === 0 ? S.active : i === 1 ? S.next : S.wait), force3D: true }));

    dotsNav.innerHTML = cards.map((c, i) => `<button type="button" aria-label="${c.dataset.title}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('');
    const dots = $$('button', dotsNav);
    let current = -1;
    const setActive = (idx) => {
      if (idx === current) return;
      current = idx;
      dots.forEach((d, j) => (j === idx ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
      cards.forEach((c, j) => { c.inert = j !== idx; });
    };
    setActive(0);

    const tl = gsap.timeline({ defaults: { duration: 1, ease: 'power1.inOut' } });
    for (let i = 1; i < cards.length; i++) {
      const at = i - 1;
      tl.to(cards[i - 1], S.past, at).to(cards[i], S.active, at);
      if (cards[i + 1]) tl.to(cards[i + 1], S.next, at);
      if (cards[i - 2]) tl.to(cards[i - 2], S.gone, at);
    }
    const steps = cards.length - 1;
    const st = ScrollTrigger.create({
      trigger: deck,
      start: 'top top',
      end: `+=${steps * 80}%`,
      pin: true,
      anticipatePin: 1,
      scrub: true,
      animation: tl,
      invalidateOnRefresh: true,
      onUpdate: (self) => setActive(Math.round(self.progress * steps)),
    });
    dots.forEach((d, i) => d.addEventListener('click', () => {
      const y = st.start + (st.end - st.start) * (i / steps);
      lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
    }));

    return () => {
      deck.classList.remove('is-pinned');
      cards.forEach((c) => { c.inert = false; });
      gsap.set(cards, { clearProps: 'all' });
      dotsNav.innerHTML = '';
    };
  });

  // Team: cards arrive from depth — the doctor first, then outwards
  gsap.fromTo('.member-card', { opacity: 0, y: 80, rotationX: -25 }, {
    opacity: 1, y: 0, rotationX: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '.team-stage', start: 'top 80%', once: true },
  });

  // Section titles + reveals
  $$('[data-lines] .ln > span').forEach((el) => {
    gsap.fromTo(el, { yPercent: 105 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el.closest('h2'), start: 'top 88%', once: true } });
  });
  gsap.set('.reveal', { opacity: 0, y: 36 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 }),
  });
})();
