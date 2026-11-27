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

  /* ── Aplike kontni, koulè, pri ── */
  function apply(d) {
    var S = d.settings || {}, C = d.content || {}, root = document.documentElement;
    Object.keys(S).forEach(function (k) { if (k.indexOf('color_') === 0 && S[k]) root.style.setProperty('--' + k.slice(6), S[k]); });
    document.querySelectorAll('[data-k]').forEach(function (el) { var v = C[el.getAttribute('data-k')]; if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-ki]').forEach(function (el) { var v = C[el.getAttribute('data-ki')]; if (v) { el.removeAttribute('srcset'); el.src = v; } });
    window.KOVAX_SETTINGS = S;
    try { var PK = location.pathname.replace(/^\/+|\/+$/g, '') || 'index';      // videyo: content key video:<paj>:<nimewo>
      document.querySelectorAll('video').forEach(function (v, i) { var u = C['video:' + PK + ':' + i]; if (!u) return;
        var auto = v.hasAttribute('autoplay'); v.querySelectorAll('source').forEach(function (x) { x.remove(); }); v.src = u; v.load(); if (auto) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    } catch (e) {}
    var K = window.KOVAX;                        // paiement.html: pri dinamik
    if (K && K.informatiquePrice !== undefined) {
      var map = { price_informatique: 'informatiquePrice', fee_informatique: 'informatiqueFee', tax_informatique_usa: 'informatiqueTaxUSA', price_anglais: 'anglaisBase', fee_anglais: 'anglaisFee', tax_anglais_usa: 'anglaisTaxUSA', price_subscription: 'subscriptionMonthly' };
      Object.keys(map).forEach(function (k) { var n = parseFloat(S[k]); if (!isNaN(n)) K[map[k]] = n; });
      try { if (typeof window.updateSummary === 'function') window.updateSummary(); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent('kovax:ready', { detail: d }));
  }
  fetch(API + '?a=settings').then(function (r) { return r.json(); }).then(apply).catch(function () {});
})();
