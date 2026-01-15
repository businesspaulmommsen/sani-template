(function(){
  "use strict";

  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  /* ===========================
     Dropdown (Desktop) – robust
  =========================== */
  const dd = qs('[data-dropdown]');
  const ddBtn  = dd ? (qs('[data-dropdown-btn]', dd) || qs('[data-dropdown-button]', dd)) : null;
  const ddMenu = dd ? (qs('[data-dropdown-menu]', dd) || qs('[data-dropdown-panel]', dd)) : null;

  function closeDropdown(){
    if(!ddBtn || !ddMenu) return;
    ddMenu.setAttribute('aria-hidden', 'true');
    ddBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown(){
    if(!ddBtn || !ddMenu) return;
    const open = ddMenu.getAttribute('aria-hidden') === 'false';
    ddMenu.setAttribute('aria-hidden', open ? 'true' : 'false');
    ddBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
  }

  if(ddBtn && ddMenu){
    if(!ddMenu.hasAttribute('aria-hidden')) ddMenu.setAttribute('aria-hidden','true');

    ddBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDropdown();
    });

    document.addEventListener('click', (e) => {
      if(dd && !dd.contains(e.target)) closeDropdown();
    });

    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeDropdown();
    });
  }

  /* ===========================
     Mobile Menu – robust
     (passt zu deinem aktuellen HTML + CSS)
  =========================== */
  const burger = qs('[data-burger]') || qs('[data-nav-toggle]');
  const mobile = qs('[data-mobile-nav]') || qs('[data-nav-mobile]');

  function setMobile(open){
    if(!burger || !mobile) return;

    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobile.setAttribute('data-open', open ? 'true' : 'false');

    // falls mobile-nav via hidden oder via CSS gesteuert wird: beides unterstützen
    if(mobile.hasAttribute('hidden')){
      if(open) mobile.removeAttribute('hidden');
      else mobile.setAttribute('hidden','');
    }
  }

  function toggleMobile(){
    if(!burger || !mobile) return;
    const open = mobile.getAttribute('data-open') === 'true';
    setMobile(!open);
  }

  if(burger && mobile){
    if(!mobile.hasAttribute('data-open')) mobile.setAttribute('data-open','false');
    if(mobile.getAttribute('data-open') !== 'true') setMobile(false);

    burger.addEventListener('click', toggleMobile);
    qsa('a', mobile).forEach(a => a.addEventListener('click', () => setMobile(false)));
  }

  /* ===========================
     Active Link Marking (Desktop + Mobile)
  =========================== */
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function markActive(selector){
    qsa(selector).forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if(!href) return;

      if(href === path) a.classList.add('is-active');
      if(path === 'index.html' && (href === 'index.html' || href === './')) a.classList.add('is-active');
    });
  }

  markActive('.nav-link');
  markActive('.nav-m-link');
  markActive('.nav-m-sublink');

  /* ===========================
     Footer year
  =========================== */
  const y = qs('#year');
  if(y) y.textContent = String(new Date().getFullYear());
  qsa('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));

  /* ===========================
     Cookie Consent
  =========================== */
  const CONSENT_KEY = 'pm_cookie_consent_v1';

  const banner = qs('[data-cookie-banner]');
  const settings = qs('[data-cookie-settings]');
  const btnAcceptAll = qs('[data-cookie-accept-all]');
  const btnReject = qs('[data-cookie-reject]');
  const btnOpenSettings = qs('[data-cookie-open-settings]');
  const btnSave = qs('[data-cookie-save]');
  const closeEls = qsa('[data-cookie-close]');

  function readConsent(){
    try{
      const raw = localStorage.getItem(CONSENT_KEY);
      if(!raw) return null;
      const obj = JSON.parse(raw);
      if(!obj || typeof obj !== 'object' || !obj.categories) return null;
      return obj;
    }catch(_e){
      return null;
    }
  }

  function applyConsent(consent){
    const c = consent?.categories || {};
    document.documentElement.dataset.consentAnalytics = c.analytics ? '1' : '0';
    document.documentElement.dataset.consentMarketing = c.marketing ? '1' : '0';
    activateDeferredScripts(c);
  }

  function activateDeferredScripts(categories){
    const deferred = qsa('script[type="text/plain"][data-cookiecategory]');
    deferred.forEach(node => {
      const cat = (node.getAttribute('data-cookiecategory') || '').toLowerCase();
      const allowed =
        (cat === 'analytics' && categories.analytics) ||
        (cat === 'marketing' && categories.marketing);

      if(!allowed) return;
      if(node.getAttribute('data-activated') === 'true') return;

      node.setAttribute('data-activated', 'true');
      const s = document.createElement('script');
      s.text = node.textContent || '';
      node.parentNode.insertBefore(s, node.nextSibling);
    });
  }

  function showBanner(){
    if(!banner) return;
    banner.hidden = false;
    if(settings) settings.hidden = true;

    const consent = readConsent();
    const c = consent?.categories || {};
    qsa('[data-cookie-toggle]').forEach(t => {
      const key = t.getAttribute('data-cookie-toggle');
      t.checked = !!c[key];
    });
  }

  function hideBanner(){
    if(!banner) return;
    banner.hidden = true;

    // wichtig: wir feuern ein Event, damit dein Karriere-Popup sauber danach zeigen kann
    document.dispatchEvent(new CustomEvent('pm:cookie:closed'));
  }

  function openSettings(){
    if(!banner) return;
    banner.hidden = false;
    if(settings) settings.hidden = false;

    const consent = readConsent();
    const c = consent?.categories || {};
    qsa('[data-cookie-toggle]').forEach(t => {
      const key = t.getAttribute('data-cookie-toggle');
      t.checked = !!c[key];
    });
  }

  function writeConsent(categories){
    const payload = {
      v: 1,
      ts: new Date().toISOString(),
      categories: {
        necessary: true,
        analytics: !!categories.analytics,
        marketing: !!categories.marketing
      }
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    applyConsent(payload);
    hideBanner();
  }

  if(banner){
    closeEls.forEach(el => el.addEventListener('click', hideBanner));
    if(btnOpenSettings) btnOpenSettings.addEventListener('click', openSettings);

    if(btnAcceptAll) btnAcceptAll.addEventListener('click', () => writeConsent({analytics:true, marketing:true}));
    if(btnReject) btnReject.addEventListener('click', () => writeConsent({analytics:false, marketing:false}));

    if(btnSave) btnSave.addEventListener('click', () => {
      const next = { analytics:false, marketing:false };
      qsa('[data-cookie-toggle]').forEach(t => {
        const key = t.getAttribute('data-cookie-toggle');
        next[key] = !!t.checked;
      });
      writeConsent(next);
    });

    const existing = readConsent();
    if(existing) applyConsent(existing);
    else showBanner();
  }

  /* ===========================
     Carousel (Index) – stabil & “Buttons gehen sicher”
     Fixes:
     - verhindert “Button klickt aber swipet/drag blockiert”
     - Pointer Events richtig (threshold + cancel)
  =========================== */
  (function initCarousel(){
    const root = qs('[data-carousel]');
    if(!root) return;

    const track = qs('[data-carousel-track]', root);
    if(!track) return;

    const slides = Array.from(track.children).filter(Boolean);
    if(slides.length < 2) return;

    const btnPrev = qs('[data-carousel-prev]', root);
    const btnNext = qs('[data-carousel-next]', root);
    const dotsWrap = qs('[data-carousel-dots]', root);
    const dots = dotsWrap ? qsa('[data-carousel-dot]', dotsWrap) : [];

    let idx = 0;

    function setActive(next){
      idx = (next + slides.length) % slides.length;
      track.style.transform = `translate3d(${-idx * 100}%,0,0)`;

      dots.forEach((d,i) => {
        d.classList.toggle('is-active', i === idx);
        if(i === idx) d.setAttribute('aria-current','true');
        else d.removeAttribute('aria-current');
      });
    }

    function prev(){ setActive(idx - 1); }
    function next(){ setActive(idx + 1); }

    // Buttons: stop propagation, damit pointer/swipe nicht dazwischen funkt
    if(btnPrev) btnPrev.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      prev();
    });

    if(btnNext) btnNext.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      next();
    });

    // Dots
    dots.forEach(d => {
      d.addEventListener('click', (e) => {
        e.preventDefault();
        const n = Number(d.getAttribute('data-carousel-dot'));
        if(Number.isFinite(n)) setActive(n);
      });
    });

    // Keyboard
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowLeft') prev();
      if(e.key === 'ArrowRight') next();
    });

    // Swipe (Pointer Events)
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const THRESHOLD = 50;

    root.addEventListener('pointerdown', (e) => {
      // wenn man auf Button/Dot klickt, nicht swipen
      const tag = (e.target && e.target.closest) ? e.target.closest('[data-carousel-prev],[data-carousel-next],[data-carousel-dot]') : null;
      if(tag) return;

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      root.setPointerCapture?.(e.pointerId);
    });

    root.addEventListener('pointercancel', () => {
      dragging = false;
    });

    root.addEventListener('pointerup', (e) => {
      if(!dragging) return;
      dragging = false;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // wenn mehr vertikal als horizontal: ignorieren (scroll)
      if(Math.abs(dy) > Math.abs(dx)) return;
      if(Math.abs(dx) < THRESHOLD) return;

      dx > 0 ? prev() : next();
    });

    window.addEventListener('resize', () => setActive(idx));

    setActive(0);
  })();

})();