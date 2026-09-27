/* Site-wide EN ⇄ AR switch.
   - Dictionaries live in public/i18n/common.json (shared chrome) + public/i18n/<page>.json.
   - Keys are the exact English text of an element (own text nodes, or innerHTML when the element
     only contains inline tags like <strong>/<em>/<br>). Values are the Arabic.
   - The original English is kept in a WeakMap so switching back is lossless.
   - Arabic uses the Thmanyah fonts (public/fonts) via the html[lang="ar"] rules below. */
(() => {
  const root = document.documentElement;
  const page = document.body.dataset.i18nPage || 'home';
  const base = document.body.dataset.i18nBase || '';
  const INLINE = new Set(['STRONG', 'EM', 'B', 'I', 'A', 'BR', 'SPAN', 'SMALL', 'SUP', 'SUB']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT', 'TEXTAREA', 'INPUT']);
  const orig = new WeakMap();
  let dict = null, current = 'en';

  const style = document.createElement('style');
  style.textContent = `
    @font-face { font-family: "Thmanyah Sans"; src: url("${base}public/fonts/thmanyahsans-Regular.otf") format("opentype"); font-weight: 400; font-display: swap; }
    @font-face { font-family: "Thmanyah Sans"; src: url("${base}public/fonts/thmanyahsans-Medium.otf") format("opentype"); font-weight: 500; font-display: swap; }
    @font-face { font-family: "Thmanyah Sans"; src: url("${base}public/fonts/thmanyahsans-Bold.otf") format("opentype"); font-weight: 600 800; font-display: swap; }
    @font-face { font-family: "Thmanyah Sans"; src: url("${base}public/fonts/thmanyahsans-Black.otf") format("opentype"); font-weight: 900; font-display: swap; }
    @font-face { font-family: "Thmanyah Serif Display"; src: url("${base}public/fonts/thmanyahserifdisplay-Medium.otf") format("opentype"); font-weight: 400 500; font-display: swap; }
    @font-face { font-family: "Thmanyah Serif Display"; src: url("${base}public/fonts/thmanyahserifdisplay-Bold.otf") format("opentype"); font-weight: 600 800; font-display: swap; }
    html[lang="ar"] body, html[lang="ar"] .font-body, html[lang="ar"] .body, html[lang="ar"] .pill, html[lang="ar"] .btn, html[lang="ar"] .tag, html[lang="ar"] .chip, html[lang="ar"] .gnav, html[lang="ar"] .gmenu, html[lang="ar"] .annotation, html[lang="ar"] .eyebrow, html[lang="ar"] .fig, html[lang="ar"] .snap, html[lang="ar"] .princ p, html[lang="ar"] .work-list, html[lang="ar"] .real, html[lang="ar"] .team, html[lang="ar"] .layer-list, html[lang="ar"] .decision p, html[lang="ar"] .timeline-row, html[lang="ar"] .cap-row, html[lang="ar"] .foot { font-family: "Thmanyah Sans", "IBM Plex Sans Arabic", system-ui, sans-serif; }
    html[lang="ar"] .serif, html[lang="ar"] .display, html[lang="ar"] .about-lead, html[lang="ar"] .work-title, html[lang="ar"] .work-card .title, html[lang="ar"] .princ h3, html[lang="ar"] .h-card, html[lang="ar"] .h-sec, html[lang="ar"] .h-hero, html[lang="ar"] .h-md, html[lang="ar"] .foot .big, html[lang="ar"] h1, html[lang="ar"] h2, html[lang="ar"] h3 { font-family: "Thmanyah Serif Display", "Thmanyah Sans", "Noto Naskh Arabic", serif; letter-spacing: 0; line-height: 1.25; }
    html[lang="ar"] .marq-item .serif { font-family: "Bricolage Grotesque", system-ui, sans-serif; letter-spacing: -0.03em; }
    html[lang="ar"] .display-name, html[lang="ar"] .foot .big, html[lang="ar"] .identity-name { font-family: "Thmanyah Sans", sans-serif; font-weight: 900; letter-spacing: 0; line-height: 1.05; }
    html[lang="ar"] .display-name .line-2 { margin-left: 0; margin-right: clamp(0px, 8vw, 7rem); }
    html[lang="ar"] .eyebrow, html[lang="ar"] .annotation, html[lang="ar"] .decision b, html[lang="ar"] .layer-list .n, html[lang="ar"] .princ .n { letter-spacing: 0; text-transform: none; font-size: .875rem; }
    html[lang="ar"] .body, html[lang="ar"] .about-copy, html[lang="ar"] p { line-height: 1.9; }
    html[lang="ar"] .serif em, html[lang="ar"] .serif i { font-style: normal; }
    html[lang="ar"] .tools-marquee, html[lang="ar"] .marquee { direction: ltr; }
    html[lang="ar"] .browser-bar .url, html[lang="ar"] .browser-view, html[lang="ar"] .stage-az .hero-title small, html[lang="ar"] .swatch p:last-child, html[lang="ar"] .num-count, html[lang="ar"] .timeline-dates { direction: ltr; }
    html[lang="ar"] .stage-az .hero-title { text-align: right; }
    html[lang="ar"] .lang-menu { left: auto; right: 50%; transform: translateX(50%); }
    html[lang="ar"] .gnav .cta svg, html[lang="ar"] .btn .arrow, html[lang="ar"] .arrow-right { transform: scaleX(-1); }
    html[lang="ar"] .decision { border-left: 0; border-right: 3px solid var(--blue, var(--accent)); }
    html[lang="ar"] .avatars img { margin-left: 0; margin-right: -12px; } html[lang="ar"] .avatars img:first-child { margin-right: 0; }
    .lang-toggle { height: 42px; min-width: 42px; border-radius: 999px; border: 0; background: transparent; color: var(--ink); display: inline-flex; align-items: center; gap: .45rem; padding: 0 .8rem; font: inherit; font-size: .9375rem; font-weight: 600; cursor: pointer; letter-spacing: .04em; }
    .lang-toggle:hover { background: rgba(122,107,168,.12); }
    .lang-toggle:focus-visible { outline: 2px solid var(--accent, var(--blue)); outline-offset: 2px; }
  `;
  document.head.appendChild(style);

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const isInlineOnly = el => el.children.length > 0 && [...el.children].every(c => INLINE.has(c.tagName) && !c.querySelector('div,p,li,h1,h2,h3,h4,ul,ol,figure,section'));

  function keyOf(el) {
    if (isInlineOnly(el)) return norm(el.innerHTML);
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    return norm(own);
  }
  function setText(el, value, inline) {
    if (inline) { el.innerHTML = value; return; }
    const tn = [...el.childNodes].filter(n => n.nodeType === 3);
    if (!tn.length) return;
    tn[0].textContent = value; tn.slice(1).forEach(n => n.textContent = '');
  }
  function walk(fn) {
    document.querySelectorAll('body *').forEach(el => { if (SKIP.has(el.tagName) || el.closest('svg') || el.closest('[data-i18n-skip]')) return; fn(el); });
  }
  function toArabic() {
    if (!dict) return;
    walk(el => {
      if (orig.has(el)) return;
      const inline = isInlineOnly(el); const k = keyOf(el);
      if (!k || !(k in dict)) return;
      orig.set(el, { inline, html: inline ? el.innerHTML : [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent) });
      setText(el, dict[k], inline);
    });
    // attribute-only strings
    document.querySelectorAll('[title]').forEach(el => { const t = el.getAttribute('title'); if (dict[t]) { el.dataset.enTitle = t; el.setAttribute('title', dict[t]); } });
  }
  function toEnglish() {
    walk(el => { const o = orig.get(el); if (!o) return; if (o.inline) el.innerHTML = o.html; else { const tn = [...el.childNodes].filter(n => n.nodeType === 3); o.html.forEach((t, i) => { if (tn[i]) tn[i].textContent = t; }); } orig.delete(el); });
    document.querySelectorAll('[data-en-title]').forEach(el => { el.setAttribute('title', el.dataset.enTitle); delete el.dataset.enTitle; });
  }
  async function load() {
    if (dict) return dict;
    const [common, own] = await Promise.all([
      fetch(base + 'public/i18n/common.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch(base + 'public/i18n/' + page + '.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]);
    dict = Object.assign({}, common, own); return dict;
  }
  async function apply(lang) {
    current = lang;
    if (lang === 'ar') { await load(); toArabic(); root.setAttribute('lang', 'ar'); root.setAttribute('dir', 'rtl'); }
    else { toEnglish(); root.setAttribute('lang', 'en'); root.setAttribute('dir', 'ltr'); }
    document.querySelectorAll('.lang-toggle').forEach(b => { b.textContent = lang === 'ar' ? 'EN' : 'عربي'; b.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'); });
    try { localStorage.setItem('lang', lang); } catch {}
    window.ScrollTrigger?.refresh?.();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  window.I18N = { apply, get lang() { return current; }, toggle: () => apply(current === 'ar' ? 'en' : 'ar') };

  // Toggle button for pages that don't have the case-study language menu
  const cta = document.querySelector('.gnav .cta.desk-only');
  if (cta && !document.querySelector('#lang-btn')) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lang-toggle glass focus-ring'; b.textContent = 'عربي'; b.addEventListener('click', () => window.I18N.toggle());
    cta.parentElement.insertBefore(b, cta);
    const gm = document.querySelector('#gmenu'); if (gm) { const mb = document.createElement('button'); mb.type = 'button'; mb.className = 'lang-toggle'; mb.style.cssText = 'justify-content:center;width:100%;border:1px solid var(--line);margin-top:.35rem'; mb.textContent = 'عربي'; mb.addEventListener('click', () => window.I18N.toggle()); gm.appendChild(mb); }
  }
  let saved = null; try { saved = localStorage.getItem('lang'); } catch {}
  const boot = () => { if (saved === 'ar') apply('ar'); };
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
