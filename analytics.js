/* KOVAX runtime: kontni modifyab, pri, koulè, swivi vizitè, rapò erè. Chaje sou tout paj yo. */
(function () {
  'use strict';
  var API = '/api/site', ls = window.localStorage, ss = window.sessionStorage;
  function id(k, store) { try { var v = store.getItem(k); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); store.setItem(k, v); } return v; } catch (e) { return 'na'; } }
  var isAdmin = false; try { isAdmin = !!ls.getItem('kovax_admin_token'); } catch (e) {}
  function send(a, data) {
    try { var s = JSON.stringify(data); if (navigator.sendBeacon) { navigator.sendBeacon(API + '?a=' + a, new Blob([s], { type: 'application/json' })); } else { fetch(API + '?a=' + a, { method: 'POST', body: s, keepalive: true }); } } catch (e) {}
  }
  window.kovaxLog = function (kind, message, stack) { if (isAdmin) return; send('error', { kind: kind, message: message, page: location.pathname, stack: stack || '' }); };

  /* ── Erè otomatik ── */
  var seen = {};
  function once(m) { if (seen[m]) return false; seen[m] = 1; return true; }
  window.addEventListener('error', function (e) { var m = (e.message || 'Erè JS') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno; if (e.message && once(m)) window.kovaxLog('js', m, e.error && e.error.stack); });
  window.addEventListener('unhandledrejection', function (e) { var m = 'Promise: ' + ((e.reason && e.reason.message) || e.reason); if (once(m)) window.kovaxLog('js', m, e.reason && e.reason.stack); });
  var ce = console.error;
  console.error = function () { try { var a = [].slice.call(arguments), f = String(a[0] || ''); if (/^\[KOVAX/.test(f)) { var m = f + ' ' + (a[1] && (a[1].message || a[1]) || ''); if (once(m)) window.kovaxLog(/Capture|PayPal|Sub/.test(f) ? 'payment' : 'js', m); } } catch (x) {} return ce.apply(console, arguments); };

  /* ── Swivi vizitè ── */
  if (!isAdmin && !/^\/(admin)/.test(location.pathname)) {
    send('track', { path: location.pathname.replace(/\/$/, '') || '/', vid: id('kovax_vid', ls), sid: id('kovax_sid', ss), ref: document.referrer ? new URL(document.referrer).hostname : '' });
  }

  /* ── Pèman: anrejistre sou paj merci-peman (yon fwa pa referans) ── */
  if (/merci-peman/.test(location.pathname) && !isAdmin) {
    var q = new URLSearchParams(location.search), key = 'kovax_pay_logged_' + (q.get('ref') || q.get('email') || '');
    try { if (!ss.getItem(key)) { ss.setItem(key, '1'); send('payment', { method: q.get('mode') || 'paypal', amount: q.get('amount'), ref: q.get('ref'), email: q.get('email'), name: ((q.get('prenom') || '') + ' ' + (q.get('nom') || '')).trim(), course: q.get('kou'), country: q.get('peyi') }); } } catch (e) {}
  }


  /* ── Animasyon global + blòk ajoute (imaj / videyo / tèks) ── */
  var PAGEKEY = (function () { var k = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, ''); return k || 'index'; })();
  var FXCSS = '.kvx-rv{opacity:0;transform:translateY(34px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}.kvx-rv.kvx-in{opacity:1;transform:none}' +
    '.kvx-lift{transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s!important}.kvx-lift:hover{transform:translateY(-8px) scale(1.015)!important;box-shadow:0 24px 50px -18px rgba(41,171,226,.55)!important}' +
    '@keyframes kvxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}.kvx-float{animation:kvxFloat 4.5s ease-in-out infinite}' +
    '@keyframes kvxGrad{0%{background-position:0% 50%}100%{background-position:200% 50%}}.kvx-grad{background-image:linear-gradient(90deg,#29ABE2,#7B2D8B,#1A3FAA,#29ABE2)!important;background-size:200% auto!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important;animation:kvxGrad 6s linear infinite}' +
    '@keyframes kvxPulse{0%{box-shadow:0 0 0 0 rgba(41,171,226,.55)}70%{box-shadow:0 0 0 16px rgba(41,171,226,0)}100%{box-shadow:0 0 0 0 rgba(41,171,226,0)}}.kvx-glow{animation:kvxPulse 2.2s infinite}' +
    '#kvx-bar{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#29ABE2,#7B2D8B);z-index:99999;transition:width .1s}' +
    '#kvx-cur{position:fixed;width:340px;height:340px;margin:-170px 0 0 -170px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,rgba(41,171,226,.16),transparent 65%);transition:transform .12s}' +
    '.kvx-ins{max-width:100%;margin:18px auto;text-align:center}.kvx-ins img,.kvx-ins video{max-width:100%;height:auto;display:inline-block}' +
    '@keyframes kvxFU{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}@keyframes kvxZ{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}@keyframes kvxSL{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}@keyframes kvxFI{from{opacity:0}to{opacity:1}}' +
    '.kvx-a-fade-up{animation:kvxFU .9s both}.kvx-a-zoom{animation:kvxZ .9s both}.kvx-a-slide{animation:kvxSL .9s both}.kvx-a-fade{animation:kvxFI 1.2s both}.kvx-a-float{animation:kvxFloat 4.5s ease-in-out infinite}.kvx-a-glow{animation:kvxPulse 2.2s infinite}' +
    '@media(prefers-reduced-motion:reduce){.kvx-rv{opacity:1;transform:none}.kvx-float,.kvx-grad,.kvx-glow,[class*="kvx-a-"]{animation:none!important}}';
  var fxIO = null, fxOff = [];
  window.kovaxFxApply = function (fx) {
    fx = fx || {};
    if (!document.getElementById('kvx-fxcss')) { var st = document.createElement('style'); st.id = 'kvx-fxcss'; st.textContent = FXCSS; document.head.appendChild(st); }
    fxOff.forEach(function (f) { try { f(); } catch (e) {} }); fxOff = [];
    var body = document.body; if (!body) return;
    function sel(q) { return [].slice.call(document.querySelectorAll(q)).filter(function (e) { return !e.closest('.kvx-ins,#kvx-bar,nav,header'); }); }
    var cards = 'section > div > div, [class*="card"], [class*="Card"], .plan, .price, .course, .feature, .benefit, article, li[class]';
    function toggle(on, q, cls) { sel(q).forEach(function (e) { e.classList.toggle(cls, !!on); }); }
    toggle(fx.lift, cards, 'kvx-lift');
    toggle(fx.float, 'img[src*="logo"],img[src*="asset"],[class*="logo"] img,.hero img', 'kvx-float');
    toggle(fx.gradient, 'h1', 'kvx-grad');
    toggle(fx.glow, 'a[class*="btn"],button[class*="btn"],.cta,[class*="cta"]', 'kvx-glow');
    if (fxIO) { fxIO.disconnect(); fxIO = null; }
    document.querySelectorAll('.kvx-rv').forEach(function (e) { e.classList.remove('kvx-rv', 'kvx-in'); });
    if (fx.reveal && 'IntersectionObserver' in window) {
      fxIO = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('kvx-in'); fxIO.unobserve(x.target); } }); }, { threshold: .12 });
      sel('section, section > *, h2, h3, img, video').forEach(function (e, i) { if (e.getBoundingClientRect().top > innerHeight * .9) { e.classList.add('kvx-rv'); e.style.transitionDelay = Math.min(i % 4 * 90, 270) + 'ms'; fxIO.observe(e); } });
    }
    var bar = document.getElementById('kvx-bar'); if (bar) bar.remove();
    if (fx.progress) { bar = document.createElement('div'); bar.id = 'kvx-bar'; body.appendChild(bar);
      var f = function () { var h = document.documentElement; bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%'; }; addEventListener('scroll', f, { passive: true }); fxOff.push(function () { removeEventListener('scroll', f); bar.remove(); }); }
    var cur = document.getElementById('kvx-cur'); if (cur) cur.remove();
    if (fx.cursor && matchMedia('(hover:hover)').matches) { cur = document.createElement('div'); cur.id = 'kvx-cur'; body.appendChild(cur);
      var m = function (e) { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }; addEventListener('mousemove', m); fxOff.push(function () { removeEventListener('mousemove', m); cur.remove(); }); }
  };
  window.kovaxInsertsApply = function (list) {
    document.querySelectorAll('.kvx-ins').forEach(function (e) { e.remove(); });
    (list || []).forEach(function (o, i) {
      if (!o || (o.page !== '*' && o.page !== PAGEKEY)) return;
      var anchor; try { anchor = document.querySelector(o.sel); } catch (e) {} if (!anchor) { anchor = document.body; o = Object.assign({}, o, { pos: 'append' }); }
      var w = document.createElement('div'); w.className = 'kvx-ins' + (o.anim && o.anim !== 'none' ? ' kvx-a-' + o.anim : ''); w.setAttribute('data-kid', o.id || i);
      var st = o.width ? 'width:' + (parseInt(o.width, 10) || 100) + '%;' : ''; w.style.cssText = st;
      var rad = 'border-radius:' + (parseInt(o.radius, 10) || 0) + 'px;';
      var h = '';
      if (o.type === 'image' && o.src) h = '<img alt="" loading="lazy" src="' + String(o.src).replace(/"/g, '&quot;') + '" style="' + rad + '">';
      else if (o.type === 'video' && o.src) h = '<video src="' + String(o.src).replace(/"/g, '&quot;') + '" controls playsinline ' + (o.autoplay ? 'autoplay muted loop ' : '') + 'style="' + rad + '"></video>';
      else if (o.type === 'text') { var t = document.createElement('div'); t.textContent = o.text || ''; t.style.cssText = 'font-size:' + (parseInt(o.size, 10) || 28) + 'px;font-weight:700;padding:10px'; w.appendChild(t); }
      if (h) w.innerHTML = h;
      if (o.link && h) { var a = document.createElement('a'); a.href = o.link; while (w.firstChild) a.appendChild(w.firstChild); w.appendChild(a); }
      if (o.pos === 'before') anchor.parentNode.insertBefore(w, anchor); else if (o.pos === 'prepend') anchor.insertBefore(w, anchor.firstChild); else if (o.pos === 'append') anchor.appendChild(w); else anchor.parentNode.insertBefore(w, anchor.nextSibling);
    });
  };

  /* ── Aplike kontni, koulè, pri ── */
  function apply(d) {
    var S = d.settings || {}, C = d.content || {}, root = document.documentElement;
    Object.keys(S).forEach(function (k) { if (k.indexOf('color_') === 0 && S[k]) root.style.setProperty('--' + k.slice(6), S[k]); });
    document.querySelectorAll('[data-k]').forEach(function (el) { var v = C[el.getAttribute('data-k')]; if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-ki]').forEach(function (el) { var v = C[el.getAttribute('data-ki')]; if (v) { el.removeAttribute('srcset'); el.src = v; } });
    window.KOVAX_SETTINGS = S;
    try { var live = false; try { live = window.parent !== window && !!window.parent.__kvxFxLive; } catch (e) {} if (!live) { window.kovaxInsertsApply(S.inserts); window.kovaxFxApply(S.fx); } } catch (e) {}
    try { var PK = location.pathname.replace(/^\/+|\/+$/g, '') || 'index';      // videyo: content key video:<paj>:<nimewo>
      document.querySelectorAll('video').forEach(function (v, i) { var u = C['video:' + PK + ':' + i]; if (!u) return;
        var auto = v.hasAttribute('autoplay'); v.querySelectorAll('source').forEach(function (x) { x.remove(); }); v.src = u; v.load(); if (auto) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    } catch (e) {}
    var K = window.KOVAX;                        // paiement.html: pri dinamik
    if (K && K.informatiquePrice !== undefined) {
      var map = { price_informatique: 'informatiquePrice', fee_informatique: 'informatiqueFee', tax_informatique_usa: 'informatiqueTaxUSA', price_anglais: 'anglaisBase', fee_anglais: 'anglaisFee', tax_anglais_usa: 'anglaisTaxUSA', price_subscription: 'subscriptionMonthly' };
      Object.keys(map).forEach(function (k) { var n = parseFloat(S[k]); if (!isNaN(n)) K[map[k]] = n; });
      var kp = (new URLSearchParams(location.search).get('kou') || '').toLowerCase(), cc = (S.courses || []).filter(function (c) { return c.active !== false && c.id === kp; })[0];
      if (cc) { K.informatiquePrice = parseFloat(cc.price) || 0; K.informatiqueFee = parseFloat(cc.fee) || 0; K.informatiqueTaxUSA = parseFloat(cc.tax) || 0; K.kouName = cc.name; }
      try { if (typeof window.updateSummary === 'function') window.updateSummary(); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent('kovax:ready', { detail: d }));
  }
  fetch(API + '?a=settings').then(function (r) { return r.json(); }).then(apply).catch(function () {});
})();
