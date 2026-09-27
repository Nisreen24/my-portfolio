/* =====================================================================
   Preloader — "blurry dots → waving figure" (GSAP 3.13)
   ---------------------------------------------------------------------
   Sequence traced frame-by-frame from the reference clip (10 dots):
     1. dots spawn one by one on a ring that rotates clockwise & settles
     2. ring morphs into a small standing figure
     3. right hand rises and waves (loops while the page is still loading)
     4. on load: figure crouches, jumps into the final pose, holds, fades
   Also re-appears whenever the browser goes offline.
   Include right after <body>; needs gsap core loaded in <head>.
   ===================================================================== */
(function () {
  if (window.__preloader) return;
  var root = document.documentElement;
  var hasGsap = typeof window.gsap !== 'undefined';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var theme = null; try { theme = localStorage.getItem('theme'); } catch (e) {}
  if (theme === 'dark') root.dataset.theme = 'dark';
  var lang = null; try { lang = localStorage.getItem('lang'); } catch (e) {}
  var isAr = lang === 'ar' || root.lang === 'ar';

  /* ---------- styles ---------- */
  var css = [
    '.pl{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;background:var(--pl-bg,#F4F1EB);color:var(--pl-ink,#131313);isolation:isolate}',
    ':root[data-theme="dark"] .pl{--pl-bg:#000;--pl-ink:#fff}',
    '.pl-blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none;will-change:transform;opacity:.9}',
    '.pl-blob.a{width:60vmax;height:60vmax;left:-18vmax;top:-30vmax;background:radial-gradient(closest-side,#8F7FC7,rgba(143,127,199,0) 72%)}',
    '.pl-blob.b{width:46vmax;height:46vmax;left:-4vmax;top:-10vmax;background:radial-gradient(closest-side,#F1B9A5,rgba(241,185,165,0) 72%)}',
    '.pl-blob.c{width:70vmax;height:70vmax;right:-30vmax;bottom:-36vmax;background:radial-gradient(closest-side,#C9C4E6,rgba(201,196,230,0) 72%)}',
    ':root[data-theme="dark"] .pl-blob{opacity:.28}',
    '.pl-noise{position:absolute;inset:0;opacity:.05;mix-blend-mode:multiply;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")}',
    ':root[data-theme="dark"] .pl-noise{mix-blend-mode:screen;opacity:.06}',
    '.pl-stage{position:relative;display:grid;place-items:center;gap:26px}',
    '.pl-dots{position:relative;width:140px;height:140px}',
    '.pl-dot{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:currentColor;opacity:0;will-change:transform}',
    '.pl-msg{font:500 .8rem/1.5 "Inter",system-ui,sans-serif;letter-spacing:.02em;text-align:center;opacity:0;transform:translateY(8px);color:var(--pl-ink,#131313)}',
    '.pl-msg b{display:block;font:600 1rem/1.3 "Bricolage Grotesque","Noto Naskh Arabic",system-ui,sans-serif;letter-spacing:-.01em;margin-bottom:.15rem}',
    '.pl-msg span{opacity:.6}',
    'html.is-loading{overflow:hidden}',
    'html.is-loading .reveal,html.is-loading .reveal-visual{animation-play-state:paused}',
    '@media (prefers-reduced-motion:reduce){.pl-dot{opacity:1}.pl-blob{filter:blur(60px)}}'
  ].join('');
  var style = document.createElement('style');
  style.id = 'pl-style';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- DOM ---------- */
  var N = 10;
  var el = document.createElement('div');
  el.className = 'pl';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', isAr ? 'جارٍ التحميل' : 'Loading');
  var dotsHtml = '';
  for (var i = 0; i < N; i++) dotsHtml += '<i class="pl-dot"></i>';
  el.innerHTML =
    '<div class="pl-blob a"></div><div class="pl-blob b"></div><div class="pl-blob c"></div><div class="pl-noise"></div>' +
    '<div class="pl-stage"><div class="pl-dots" aria-hidden="true">' + dotsHtml + '</div>' +
    '<p class="pl-msg" hidden></p></div>';
  root.classList.add('is-loading');
  (document.body || root).appendChild(el);

  var dots = Array.prototype.slice.call(el.querySelectorAll('.pl-dot'));
  var msg = el.querySelector('.pl-msg');
  var blobs = el.querySelectorAll('.pl-blob');

  /* ---------- geometry (reference units → px via K) ---------- */
  var K = 0.65;                    // reference clip: ring r≈55, dot ⌀≈14 → here dot 9px
  var R = 55 * K;
  var STEP = 36, START_ANGLE = -32; // dot k settles at -32° − 36k (clockwise ring)
  var SPIN = 90;                    // whole ring rotates 90° clockwise while forming
  function sc(p) { return [p[0] * K, p[1] * K]; }
  // parts: 0 head, 1 shoulderR, 2 shoulderL, 3 chest, 4 handR, 5 handL, 6 hipR, 7 hipL, 8 footR, 9 footL
  var POSE = {
    stand:  [[-2.4,-54.9],[28.2,-30.3],[-33.5,-30.1],[-2.4,-26.5],[36.3,-0.3],[-41.1,-0.2],[12.6,12.2],[-17.7,12.3],[12.6,50.9],[-18.2,51]].map(sc),
    crouch: [[-2.5,-7.5],[25.2,10.2],[-30.4,11.2],[-2.4,14.7],[35.7,32.7],[-39.6,31.9],[13.4,30.7],[-18.2,31],[12.5,51],[-18.2,51]].map(sc),
    jump:   [[-4.7,-54.5],[19.5,-45.5],[-17.9,-20.4],[9.5,-20.4],[30,-70.5],[-44.8,-20.3],[39.4,-3.7],[-4.6,14.6],[26.3,30.1],[-17.7,47.7]].map(sc)
  };
  // right-hand path while waving (reference frames f040→f067), with segment durations
  var WAVE = [
    { p: [57, -24],     d: .2,  e: 'power1.in' },
    { p: [44.7, -58.6], d: .13, e: 'none' },
    { p: [21.8, -66.7], d: .14, e: 'power2.out' },
    { p: [47, -54.4],   d: .33, e: 'sine.inOut' },
    { p: [24.5, -65.8], d: .33, e: 'sine.inOut' },
    { p: [48, -53.8],   d: .33, e: 'sine.inOut' },
    { p: [59, -31],     d: .27, e: 'power1.inOut' },
    { p: [36.3, -0.3],  d: .3,  e: 'power2.out' }
  ];
  // body lean when the hand swings left (measured offsets at the leftmost hand position)
  var LEAN = { 0: [-6, .3], 1: [-3.8, -5.4], 2: [-2.4, 3.3], 3: [-2.2, .1], 5: [-1.3, 3.6] };

  var ringPos = [];
  for (var k = 0; k < N; k++) ringPos.push(null);
  function ringXY(k, rot) { var a = (START_ANGLE - STEP * k + rot) * Math.PI / 180; return [Math.cos(a) * R, Math.sin(a) * R]; }

  // map ring dots → body parts by greedy nearest neighbour (short travel like the clip)
  var partOf = null;
  function assignParts() {
    var free = POSE.stand.map(function (_, i) { return i; });
    partOf = [];
    for (var k = 0; k < N; k++) {
      var r = ringXY(k, 0), best = 0, bd = 1e9;
      for (var j = 0; j < free.length; j++) { var p = POSE.stand[free[j]]; var d = (p[0]-r[0])*(p[0]-r[0]) + (p[1]-r[1])*(p[1]-r[1]); if (d < bd) { bd = d; best = j; } }
      partOf[k] = free.splice(best, 1)[0];
    }
  }
  function dotFor(part) { return dots[partOf.indexOf(part)]; }
  function poseVars(pose) {
    return { x: function (k) { return pose[partOf[k]][0]; }, y: function (k) { return pose[partOf[k]][1]; } };
  }

  var state = { intro: null, loop: null, exiting: false, done: false, offline: false, started: performance.now() };
  var MIN_SHOW = 3400, MAX_SHOW = 10000;

  /* ---------- 1+2: ring build → figure ---------- */
  function buildIntro() {
    assignParts();
    var spin = { rot: -SPIN };
    gsap.set(dots, { scale: 0, opacity: 0, x: function (k) { return ringXY(k, spin.rot)[0]; }, y: function (k) { return ringXY(k, spin.rot)[1]; } });
    var tl = gsap.timeline();
    tl.to(spin, { rot: 0, duration: 1.2, ease: 'power2.out', onUpdate: function () {
      for (var k = 0; k < N; k++) { var p = ringXY(k, spin.rot); gsap.set(dots[k], { x: p[0], y: p[1] }); }
    } }, 0)
      .to(dots, { scale: 1, opacity: 1, duration: .28, ease: 'back.out(2.4)', stagger: .125 }, 0)
      .to(dots, { x: poseVars(POSE.stand).x, y: poseVars(POSE.stand).y, duration: .8, ease: 'power3.out' }, 1.25);
    return tl;
  }

  /* ---------- 3: wave loop ---------- */
  function buildWave() {
    var hand = dotFor(4);
    var tl = gsap.timeline({ repeat: -1, repeatDelay: .35 });
    var base = POSE.stand;
    var leanUpd = function () {
      var hx = gsap.getProperty(hand, 'x') / K;                 // back to reference units
      var lean = Math.max(0, Math.min(1, (47 - hx) / 25));       // 0 at hand right, 1 at leftmost
      var up = Math.max(0, Math.min(1, -(gsap.getProperty(hand, 'y') / K) / 60)); // only when raised
      var L = lean * up;
      for (var part in LEAN) { var o = LEAN[part], b = base[part]; gsap.set(dotFor(+part), { x: b[0] + o[0] * K * L, y: b[1] + o[1] * K * L }); }
    };
    WAVE.forEach(function (s) { var p = sc(s.p); tl.to(hand, { x: p[0], y: p[1], duration: s.d, ease: s.e, onUpdate: leanUpd }); });
    return tl;
  }

  function startMotion() {
    if (!hasGsap || reduce) {
      assignParts();
      for (var k = 0; k < N; k++) { var p = POSE.jump[partOf[k]]; dots[k].style.opacity = 1; dots[k].style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)'; }
      return;
    }
    gsap.to(blobs[0], { xPercent: 10, yPercent: 8, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(blobs[1], { xPercent: -12, yPercent: 10, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(blobs[2], { xPercent: -8, yPercent: -10, duration: 13, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    state.intro = buildIntro();
    state.intro.eventCallback('onComplete', function () { state.loop = buildWave(); });
  }

  function showMsg(title, sub) {
    msg.innerHTML = '<b>' + title + '</b><span>' + sub + '</span>';
    msg.hidden = false;
    if (hasGsap && !reduce) gsap.to(msg, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' });
    else { msg.style.opacity = 1; msg.style.transform = 'none'; }
  }
  function hideMsg() { msg.hidden = true; msg.style.opacity = 0; }

  /* ---------- 4: crouch → jump → hold → fade ---------- */
  function finish() {
    if (state.exiting || state.done) return;
    state.exiting = true;
    var end = function () {
      state.done = true; state.exiting = false;
      root.classList.remove('is-loading');
      el.style.display = 'none';
      if (hasGsap) { gsap.killTweensOf(blobs); if (state.loop) state.loop.kill(); if (state.intro) state.intro.kill(); }
      window.dispatchEvent(new CustomEvent('preloader:done'));
    };
    if (!hasGsap || reduce) {
      el.style.transition = 'opacity .35s ease'; el.style.opacity = 0;
      root.classList.remove('is-loading');
      setTimeout(end, 380); return;
    }
    var run = function () {
      if (state.loop) { state.loop.kill(); state.loop = null; }
      var tl = gsap.timeline({ onComplete: end });
      tl.to(dots, { x: poseVars(POSE.crouch).x, y: poseVars(POSE.crouch).y, duration: .4, ease: 'power2.inOut', overwrite: true })
        .to(dots, { x: poseVars(POSE.jump).x, y: poseVars(POSE.jump).y, duration: .42, ease: 'power3.out' }, '+=.2')
        .to(el, { autoAlpha: 0, duration: .55, ease: 'power2.inOut' }, '+=.75')
        .add(function () { root.classList.remove('is-loading'); }, '-=.5');
    };
    if (state.intro && state.intro.progress() < 1) state.intro.eventCallback('onComplete', run); else run();
  }

  function scheduleFinish() {
    var elapsed = performance.now() - state.started;
    setTimeout(finish, Math.max(0, MIN_SHOW - elapsed));
  }
  if (document.readyState === 'complete') scheduleFinish(); else window.addEventListener('load', scheduleFinish);
  setTimeout(function () { if (!state.done) finish(); }, MAX_SHOW);
  window.addEventListener('pageshow', function (e) { if (e.persisted && !state.done) finish(); });

  /* ---------- offline / online ---------- */
  function goOffline() {
    if (state.offline) return;
    state.offline = true;
    root.classList.add('is-loading');
    el.style.display = '';
    el.setAttribute('aria-label', isAr ? 'انقطع الاتصال' : 'Connection lost');
    if (hasGsap && !reduce) {
      gsap.set(el, { autoAlpha: 0 });
      gsap.to(el, { autoAlpha: 1, duration: .5, ease: 'power2.out' });
      state.intro = buildIntro();
      state.intro.eventCallback('onComplete', function () { state.loop = buildWave(); });
    } else { el.style.opacity = 1; }
    showMsg(isAr ? 'انقطع الاتصال بالإنترنت' : 'You’re offline', isAr ? 'هنكمل أول ما الاتصال يرجع…' : 'Waiting for the connection to come back…');
  }
  function goOnline() {
    if (!state.offline) return;
    state.offline = false; state.done = false;
    hideMsg();
    finish();
  }
  window.addEventListener('offline', goOffline);
  window.addEventListener('online', goOnline);
  if (navigator.onLine === false) window.addEventListener('preloader:done', goOffline, { once: true });

  startMotion();
  window.__preloader = { finish: finish, showOffline: goOffline, hideOffline: goOnline };
})();
