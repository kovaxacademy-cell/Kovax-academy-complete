/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       KOVAX ACADEMY — SOUND ENGINE v6  · Ultra Soft Premium     ║
 * ║       Pure Web Audio · No Button · No Dependencies          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════
     CORE ENGINE
  ═══════════════════════════════════ */
  var _ac  = null;
  var _on  = true;
  var _vol = 0.055;   /* master — ultra doux premium */

  function ctx() {
    if (!_ac) try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    return _ac;
  }

  function wake(cb) {
    var c = ctx(); if (!c) return;
    if (c.state === 'suspended') c.resume().then(cb || noop); else if (cb) cb();
  }

  function noop(){}

  /* Shared compressor — glue everything together */
  var _bus = null;
  function bus() {
    var c = ctx(); if (!c) return null;
    if (!_bus) {
      var comp = c.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value      = 12;
      comp.ratio.value     = 4;
      comp.attack.value    = 0.004;
      comp.release.value   = 0.20;
      /* Soft reverb tail via convolver */
      try {
        var rev  = c.createConvolver();
        var len  = Math.floor(c.sampleRate * 1.2);
        var buf  = c.createBuffer(2, len, c.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
          var d = buf.getChannelData(ch);
          for (var i = 0; i < len; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
        }
        rev.buffer = buf;
        var wet = c.createGain(); wet.gain.value = 0.035;
        var dry = c.createGain(); dry.gain.value = 0.965;
        comp.connect(dry);  dry.connect(c.destination);
        comp.connect(rev);  rev.connect(wet); wet.connect(c.destination);
        _bus = comp;
      } catch(e) {
        comp.connect(c.destination);
        _bus = comp;
      }
    }
    return _bus;
  }

  /* ── Sine / triangle / etc oscillator ── */
  function tone(freq, type, vol, hold, atk, rel, delay) {
    if (!_on) return;
    var c = ctx(), b = bus(); if (!c || !b) return;
    delay = delay || 0;
    try {
      var o = c.createOscillator();
      var g = c.createGain();
      o.connect(g); g.connect(b);
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, c.currentTime + delay);
      var v = (vol || 0.09) * _vol;
      var a = atk  || 0.010;
      var r = rel  || 0.28;
      var t = c.currentTime + delay;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + a);
      g.gain.setValueAtTime(v, t + a + (hold || 0));
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + r);
      o.start(t);
      o.stop(t + a + (hold || 0) + r + 0.06);
    } catch(e){}
  }

  /* ── FM bell — warm metallic shimmer ── */
  function bell(carrier, mRatio, mIdx, vol, dur, delay) {
    if (!_on) return;
    var c = ctx(), b = bus(); if (!c || !b) return;
    delay = delay || 0;
    try {
      var mod  = c.createOscillator();
      var modG = c.createGain();
      var car  = c.createOscillator();
      var outG = c.createGain();
      mod.frequency.value = carrier * mRatio;
      modG.gain.value     = carrier * mIdx;
      mod.connect(modG); modG.connect(car.frequency);
      car.connect(outG); outG.connect(b);
      var v = (vol || 0.09) * _vol;
      var t = c.currentTime + delay;
      outG.gain.setValueAtTime(0, t);
      outG.gain.linearRampToValueAtTime(v, t + 0.010);
      outG.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.55));
      mod.start(t); car.start(t);
      mod.stop(t + (dur || 0.55) + 0.06);
      car.stop(t + (dur || 0.55) + 0.06);
    } catch(e){}
  }

  /* ── Silk noise breath ── */
  function silk(vol, dur, freq, q) {
    if (!_on) return;
    var c = ctx(), b = bus(); if (!c || !b) return;
    try {
      var len = Math.floor(c.sampleRate * (dur || 0.12));
      var buf = c.createBuffer(1, len, c.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
      var src = c.createBufferSource(); src.buffer = buf;
      var f   = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = freq || 1800; f.Q.value = q || 0.6;
      var g   = c.createGain();
      g.gain.setValueAtTime((vol || 0.06) * _vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.12));
      src.connect(f); f.connect(g); g.connect(b); src.start();
    } catch(e){}
  }

  /* ── Sequence ── */
  function seq(notes, type, vol, gap, hold, atk, rel) {
    notes.forEach(function(n, i) {
      setTimeout(function(){ tone(n, type, vol, hold, atk, rel); }, i * (gap || 80));
    });
  }

  /* ── Bell sequence ── */
  function bellSeq(notes, mR, mI, vol, dur, gap) {
    notes.forEach(function(n, i) {
      setTimeout(function(){ bell(n, mR, mI, vol, dur); }, i * (gap || 90));
    });
  }

  /* ═══════════════════════════════════
     SOUND LIBRARY — Silk & Professional
  ═══════════════════════════════════ */
  var S = {

    /* ═══ ULTRA SOFT PREMIUM TECH MODE ═══
       Son yo trè dous, pro, teknoloji, san bri fò.
    */

    /* Hover — ti glass breath, prèske pa tande */
    hover: function() {
      silk(0.0012, 0.035, 4200, 0.9);
    },

    /* Card hover — premium air, trè lejè */
    cardHover: function() {
      silk(0.0045, 0.055, 2600, 0.7);
    },

    /* Card select — soft digital lock */
    cardSelect: function() {
      silk(0.006, 0.045, 3600, 0.85);
      tone(523, 'sine', 0.010, 0, 0.008, 0.09);
      tone(784, 'sine', 0.006, 0, 0.006, 0.08, 0.04);
    },

    /* Primary button — elegant AI chime */
    btnPrimary: function() {
      silk(0.0022, 0.040, 4600, 1.0);
      tone(740, 'sine', 0.0035, 0, 0.007, 0.08);
      tone(1175, 'sine', 0.0020, 0, 0.006, 0.07, 0.045);
    },

    /* Secondary / ghost button — light glass tap */
    btnSecondary: function() {
      tone(440, 'triangle', 0.008, 0, 0.006, 0.08);
    },

    inputFocus: function() {
      tone(988, 'sine', 0.006, 0, 0.006, 0.08);
    },

    keystroke: function() {
      tone(1250 + Math.random() * 120, 'sine', 0.0015, 0, 0.002, 0.014);
    },

    fieldOK: function() {
      tone(659, 'sine', 0.008, 0, 0.006, 0.08);
      tone(988, 'sine', 0.004, 0, 0.005, 0.07, 0.04);
    },

    step: function() {
      silk(0.006, 0.060, 2400, 0.75);
      tone(659, 'sine', 0.007, 0, 0.007, 0.08, 0.02);
    },

    error: function() {
      tone(220, 'triangle', 0.010, 0.020, 0.006, 0.10);
      tone(196, 'triangle', 0.006, 0.015, 0.006, 0.08, 0.09);
    },

    woosh: function() {
      silk(0.006, 0.085, 1900, 0.55);
    },

    faqOpen: function() {
      tone(523, 'sine', 0.009, 0, 0.006, 0.08);
      tone(659, 'sine', 0.005, 0, 0.005, 0.07, 0.045);
    },

    faqClose: function() {
      tone(440, 'triangle', 0.006, 0, 0.006, 0.075);
    },

    menuOpen: function() {
      silk(0.0065, 0.065, 2800, 0.8);
      tone(587, 'sine', 0.009, 0, 0.006, 0.085);
      tone(740, 'sine', 0.005, 0, 0.005, 0.070, 0.04);
    },

    menuClose: function() {
      tone(494, 'triangle', 0.007, 0, 0.006, 0.075);
      tone(392, 'triangle', 0.004, 0, 0.005, 0.060, 0.04);
    },

    backTop: function() {
      silk(0.006, 0.070, 2400, 0.65);
      tone(784, 'sine', 0.007, 0, 0.006, 0.08, 0.02);
    },

    copy: function() {
      tone(1047, 'sine', 0.008, 0, 0.005, 0.070);
      tone(1318, 'sine', 0.004, 0, 0.004, 0.060, 0.035);
    },

    toggleOn: function() {
      silk(0.006, 0.050, 3200, 0.9);
      tone(622, 'sine', 0.010, 0, 0.006, 0.09);
      tone(932, 'sine', 0.005, 0, 0.005, 0.075, 0.045);
    },

    toggleOff: function() {
      tone(392, 'triangle', 0.007, 0, 0.006, 0.075);
      silk(0.004, 0.040, 1800, 0.6);
    },

    chatOpen: function() {
      silk(0.006, 0.060, 3400, 0.85);
      tone(523, 'sine', 0.009, 0, 0.006, 0.09);
      tone(784, 'sine', 0.005, 0, 0.005, 0.075, 0.045);
    },

    chatClose: function() {
      tone(415, 'triangle', 0.006, 0, 0.006, 0.075);
    },

    msgSend: function() {
      tone(880, 'sine', 0.008, 0, 0.005, 0.070);
      silk(0.004, 0.040, 4200, 0.8);
    },

    msgRecv: function() {
      tone(659, 'sine', 0.007, 0, 0.006, 0.080);
      tone(988, 'sine', 0.004, 0, 0.005, 0.065, 0.040);
    },

    /* Welcome — soft AI startup, dous anpil */
    welcome: function() {
      silk(0.0020, 0.080, 2800, 0.55);
      tone(523, 'sine', 0.0028, 0, 0.014, 0.12, 0.03);
      tone(880, 'sine', 0.0018, 0, 0.012, 0.12, 0.16);
    },

    welcomeChoice: function() {
      silk(0.006, 0.100, 3000, 0.65);
      tone(440, 'sine', 0.008, 0, 0.012, 0.16, 0.03);
      tone(659, 'sine', 0.006, 0, 0.012, 0.14, 0.16);
      tone(880, 'sine', 0.004, 0, 0.010, 0.16, 0.28);
    },

    welcomeForm: function() {
      tone(440, 'sine', 0.007, 0, 0.012, 0.14);
      tone(587, 'sine', 0.004, 0, 0.012, 0.12, 0.10);
    },

    welcomePayment: function() {
      silk(0.005, 0.090, 2200, 0.55);
      tone(330, 'sine', 0.007, 0, 0.014, 0.18);
      tone(494, 'sine', 0.004, 0, 0.012, 0.15, 0.15);
    },

    success: function() {
      silk(0.008, 0.100, 3600, 0.65);
      tone(523, 'sine', 0.010, 0, 0.008, 0.10);
      tone(784, 'sine', 0.007, 0, 0.007, 0.10, 0.07);
      tone(1047, 'sine', 0.005, 0, 0.006, 0.12, 0.14);
    },

    payment: function() {
      silk(0.006, 0.100, 2600, 0.55);
      tone(392, 'sine', 0.008, 0, 0.010, 0.16);
      tone(587, 'sine', 0.005, 0, 0.010, 0.14, 0.12);
    },

    triumph: function() {
      silk(0.008, 0.130, 3900, 0.55);
      tone(523, 'sine', 0.010, 0, 0.010, 0.16);
      tone(784, 'sine', 0.007, 0, 0.010, 0.16, 0.14);
      tone(1047, 'sine', 0.005, 0, 0.010, 0.22, 0.30);
    },

    /* Market welcome — elegant shop tone, pa fò */
    shopBell: function() {
      silk(0.0018, 0.050, 3600, 0.75);
      tone(880, 'sine', 0.0025, 0, 0.006, 0.07);
    },

    /* Add cart — premium tech click, sèl ti son ki pi prezan */
    addCart: function() {
      silk(0.0025, 0.040, 5000, 1.1);
      tone(740, 'sine', 0.0038, 0, 0.004, 0.060);
      tone(1175, 'sine', 0.0022, 0, 0.004, 0.050, 0.035);
    },

    notify: function() {
      tone(740, 'sine', 0.008, 0, 0.006, 0.080);
      tone(988, 'sine', 0.004, 0, 0.005, 0.070, 0.045);
    }
  };

  /* ═══════════════════════════════════
     PAGE DETECTION
  ═══════════════════════════════════ */
  var PAGE = (function() {
    var p = (window.location.pathname.split('/').pop() || '').replace(/\?.*/, '');
    if (!p || p === 'index.html')          return 'index';
    if (p.indexOf('market')      !== -1)   return 'market';
    if (p.indexOf('enskripsyon') !== -1)   return 'enskripsyon';
    if (p.indexOf('formulaire')  !== -1)   return 'formulaire';
    if (p.indexOf('paiement')    !== -1)   return 'paiement';
    if (p.indexOf('merci-peman') !== -1)   return 'merci-peman';
    if (p.indexOf('merci')       !== -1)   return 'merci';
    return 'index';
  })();

  /* ═══════════════════════════════════
     EVENT WIRING
  ═══════════════════════════════════ */
  function q(sel)  { return document.querySelectorAll(sel); }

  function on(sel, evt, fn) {
    q(sel).forEach(function(el){ el.addEventListener(evt, fn, false); });
  }

  function tap(sel, fn) {
    q(sel).forEach(function(el){
      el.addEventListener('click',    fn, false);
      el.addEventListener('touchend', fn, { passive: true });
    });
  }

  function wireCommon() {
    /* PREMIUM TECH SOFT MODE — son esansyèl + hover trè dous */
    var last = 0;
    function safe(fn){
      return function(){
        var now = Date.now();
        if(now - last < 260) return;
        last = now;
        fn.call(this);
      };
    }

    /* Hover trè dous, ak gwo cooldown pou pa fè bri */
    var hoverLast = 0;
    function softHover(fn){
      return function(){
        var now = Date.now();
        if(now - hoverLast < 950) return;
        hoverLast = now;
        fn.call(this);
      };
    }
    on('.btn-glow,.btn-ghost,.btn-pri,.primary,.ghost,.product,.card,.glass-card,.item,.premiumTop,.cartBtn', 'mouseenter', softHover(S.hover));

    /* Bouton prensipal sèlman */
    tap('.btn-glow,.btn-pri,.btn-pri-m,.nav-btn,.primary,.btn,.buyNow,.checkoutBtn,[data-buy],.premiumTop', safe(S.btnPrimary));

    /* Add to cart / panier */
    tap('.addCart,.add-cart,.cartBtn,.cart-add,.btnCart,[data-add-cart],[onclick*="addToCart"],[onclick*="addCart"]', safe(S.addCart));

    /* Menu mobile */
    on('#hamburger,.hamburger,.navToggle,.menuBtn', 'click', function() {
      var m = document.getElementById('mobileMenu') || document.getElementById('mobileNav') || document.querySelector('.mobile-menu,.mobileNav,.nav-mobile');
      (m && m.classList.contains('open')) ? S.menuClose() : S.menuOpen();
    });

    /* FAQ sèlman lè ouvri/fèmen */
    tap('.faq-q,.faq-question', function() {
      var item = this.parentElement || (this.closest && this.closest('.faq-item'));
      (item && item.classList.contains('open')) ? S.faqClose() : S.faqOpen();
    });

    /* Chat: ouvri/fèmen + voye mesaj */
    on('.chat-btn', 'click', function() {
      var w = document.querySelector('.chat-window');
      (w && w.classList.contains('open')) ? S.chatClose() : S.chatOpen();
    });
    tap('.chat-send', safe(S.msgSend));

    /* Copy / notification */
    tap('[data-copy],[class*="copy-btn"],[onclick*="copy"]', safe(function(){ S.copy(); setTimeout(S.notify, 120); }));
  }

  function wirePage() {
    if (PAGE === 'index') {
      setTimeout(S.welcome, 600);
    }

    else if (PAGE === 'market') {
      setTimeout(S.shopBell, 550);
      /* market duplicate sound binding removed to avoid loud double sound */
    }

    else if (PAGE === 'enskripsyon') {
      setTimeout(S.welcomeChoice, 550);
      tap('.choice-card,.choice-btn', S.cardSelect);
      on('.choice-card', 'mouseenter', function(){ tone(440,'sine',0.040,0,0.007,0.12); });
    }

    else if (PAGE === 'formulaire') {
      setTimeout(S.welcomeForm, 500);
      on('input,select,textarea', 'focus', S.inputFocus);
      on('input,textarea', 'input', function(){ if (Math.random() > 0.62) S.keystroke(); });
      tap('[type="submit"],#submitBtn,.submit-btn,.btn-submit', function(){
        S.btnPrimary(); setTimeout(S.step, 200);
      });
      tap('.next-btn,.prev-btn,.step-btn', S.step);
      q('input,select').forEach(function(inp){
        inp.addEventListener('blur', function(){
          if (inp.value.trim().length > 0)
            inp.checkValidity() ? S.fieldOK() : S.error();
        });
      });
    }

    else if (PAGE === 'paiement') {
      setTimeout(S.welcomePayment, 550);
      on('input[type="checkbox"],input[type="radio"],.kovax-toggle input,#usaToggle',
        'change', function(e){ e.target.checked ? S.toggleOn() : S.toggleOff(); });
      tap('.plan-card,.price-card,.method-card,.pay-method', S.cardSelect);
      on('.plan-card,.price-card,.method-card', 'mouseenter', function(){
        tone(415,'sine',0.032,0,0.006,0.10);
      });
      tap('#payBtn,#submitPay,.pay-btn', S.payment);
      tap('[type="submit"]', function(){ S.btnPrimary(); setTimeout(S.step, 180); });
      on('input,select', 'focus', S.inputFocus);
      on('input', 'input', function(){ if (Math.random() > 0.68) S.keystroke(); });
      tap('[onclick*="copy"],[data-copy],.copy-btn', function(){
        S.copy(); setTimeout(S.notify, 140);
      });
    }

    else if (PAGE === 'merci-peman') {
      setTimeout(S.triumph, 700);
      tap('[onclick*="copy"],[data-copy],.copy-btn', function(){
        S.copy(); setTimeout(S.notify, 150);
      });
    }

    else if (PAGE === 'merci') {
      setTimeout(S.shopBell, 550);
      tap('.btn.primary,.buy-btn,[class*="achte"],[class*="buy"]', S.addCart);
      on('.btn.primary,.buy-btn', 'mouseenter', function(){ tone(659,'sine',0.032,0,0.005,0.09); });
      on('.bk-card,.vid-card,.prompt-card,.prod-card,.gridItem', 'mouseenter', S.cardHover);
      tap('.bk-card,.vid-card,.prompt-card,.prod-card,.gridItem', S.cardSelect);
      tap('.acc-head,.acc-toggle', function(){ S.faqOpen(); silk(0.032,0.10,1100,0.6); });
      tap('.cats a,.cat-btn', S.step);
    }
  }

  /* ═══════════════════════════════════
     BOOTSTRAP
  ═══════════════════════════════════ */
  var _wired = false;
  function start() {
    if (_wired) return; _wired = true;
    wake(function(){ wireCommon(); wirePage(); });
  }

  ['click','touchstart','keydown'].forEach(function(ev){
    document.addEventListener(ev, function boot(){
      document.removeEventListener(ev, boot);
      start();
    }, { passive: true, once: true });
  });

  window.KovaxSound = {
    play: S,
    enabled: function(){ return _on; },
    off: function(){
      _on = false;
      try { if (_ac && _ac.state === 'running') _ac.suspend(); } catch(e){}
    },
    on: function(){
      _on = true;
      wake();
    }
  };

})();
