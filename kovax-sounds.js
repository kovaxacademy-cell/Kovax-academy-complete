/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       KOVAX ACADEMY — SOUND ENGINE v4  · Silk & Elegant     ║
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
  var _vol = 0.42;   /* master — doux mais présent */

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
        var wet = c.createGain(); wet.gain.value = 0.12;
        var dry = c.createGain(); dry.gain.value = 0.88;
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

    /* ── UI micro-interactions ── */

    /* Hover — imperceptible breath */
    hover: function() {
      tone(1480, 'sine', 0.022, 0, 0.006, 0.09);
    },

    /* Card hover — low warm hum */
    cardHover: function() {
      bell(220, 3.5, 0.6, 0.022, 0.22);
    },

    /* Card select */
    cardSelect: function() {
      bell(523, 2, 1.0, 0.09, 0.32);
      tone(784, 'sine', 0.055, 0, 0.008, 0.20, 0.07);
    },

    /* Primary button — elegant double chime */
    btnPrimary: function() {
      bell(440, 2.5, 1.2, 0.10, 0.30);
      tone(659, 'sine', 0.055, 0, 0.008, 0.18, 0.06);
    },

    /* Secondary / ghost button */
    btnSecondary: function() {
      tone(370, 'triangle', 0.075, 0, 0.008, 0.16);
    },

    /* ── Forms ── */

    /* Input focus — gentle tone */
    inputFocus: function() {
      tone(830, 'sine', 0.045, 0, 0.008, 0.14);
    },

    /* Keystroke — barely-there click */
    keystroke: function() {
      tone(1050 + Math.random() * 250, 'sine', 0.008, 0, 0.003, 0.028);
    },

    /* Field validated */
    fieldOK: function() {
      tone(659, 'sine', 0.048, 0, 0.006, 0.14);
      tone(880, 'sine', 0.030, 0, 0.005, 0.12, 0.06);
    },

    /* Step forward */
    step: function() {
      silk(0.042, 0.10, 1300, 0.7);
      tone(523, 'sine', 0.055, 0, 0.008, 0.16, 0.02);
    },

    /* Error */
    error: function() {
      tone(196, 'sine', 0.075, 0.04, 0.008, 0.20);
      tone(165, 'sine', 0.055, 0.03, 0.008, 0.18, 0.14);
    },

    /* ── Navigation ── */

    /* Section reveal woosh — soft landing */
    woosh: function() {
      silk(0.040, 0.16, 1500, 0.55);
      tone(523, 'sine', 0.018, 0, 0.010, 0.18);
    },

    /* FAQ expand */
    faqOpen: function() {
      tone(440, 'sine', 0.058, 0, 0.007, 0.14);
      tone(554, 'sine', 0.038, 0, 0.006, 0.13, 0.07);
    },

    /* FAQ collapse */
    faqClose: function() {
      tone(494, 'triangle', 0.055, 0, 0.007, 0.14);
      tone(370, 'triangle', 0.035, 0, 0.006, 0.12, 0.07);
    },

    /* Menu open */
    menuOpen: function() {
      tone(440, 'sine', 0.055, 0, 0.007, 0.13);
      tone(523, 'sine', 0.038, 0, 0.006, 0.12, 0.06);
    },

    /* Menu close */
    menuClose: function() {
      tone(494, 'triangle', 0.055, 0, 0.007, 0.13);
      tone(415, 'triangle', 0.038, 0, 0.006, 0.12, 0.06);
    },

    /* Back to top */
    backTop: function() {
      silk(0.040, 0.12, 1400, 0.6);
      tone(659, 'sine', 0.055, 0, 0.007, 0.14, 0.02);
    },

    /* Copy clipboard */
    copy: function() {
      tone(880,  'sine', 0.065, 0, 0.006, 0.11);
      tone(1108, 'sine', 0.042, 0, 0.005, 0.09, 0.05);
    },

    /* Toggle ON */
    toggleOn: function() {
      tone(494, 'sine', 0.075, 0, 0.007, 0.14);
      tone(622, 'sine', 0.050, 0, 0.006, 0.13, 0.07);
    },

    /* Toggle OFF */
    toggleOff: function() {
      tone(415, 'triangle', 0.068, 0, 0.007, 0.13);
      tone(330, 'triangle', 0.045, 0, 0.006, 0.12, 0.07);
    },

    /* ── Chat ── */

    chatOpen: function() {
      bell(330, 2, 0.9, 0.08, 0.32);
      tone(494, 'sine', 0.050, 0, 0.008, 0.16, 0.10);
    },

    chatClose: function() {
      tone(415, 'triangle', 0.068, 0, 0.007, 0.14);
      tone(330, 'triangle', 0.045, 0, 0.006, 0.12, 0.07);
    },

    msgSend: function() {
      tone(740,  'sine', 0.075, 0, 0.006, 0.12);
      tone(988,  'sine', 0.048, 0, 0.005, 0.10, 0.06);
      silk(0.030, 0.06, 3200, 0.8);
    },

    msgRecv: function() {
      bell(523, 2, 0.7, 0.07, 0.28);
      tone(659, 'sine', 0.042, 0, 0.006, 0.13, 0.07);
    },

    /* ── Page welcome chimes ── */

    /* Index — warm 4-note arrival */
    welcome: function() {
      bellSeq([261, 329, 392, 523], 2.5, 0.8, 0.075, 0.45, 105);
    },

    /* Enskripsyon — lighter 3-note */
    welcomeChoice: function() {
      bellSeq([329, 415, 523], 2, 0.7, 0.070, 0.38, 100);
    },

    /* Formulaire — soft 2-note breath */
    welcomeForm: function() {
      tone(392, 'sine', 0.058, 0, 0.012, 0.26);
      tone(494, 'sine', 0.040, 0, 0.012, 0.24, 0.12);
    },

    /* Paiement — secure, calm, ceremonial */
    welcomePayment: function() {
      bell(293, 2, 1.5, 0.068, 0.55);
      tone(440, 'sine', 0.048, 0, 0.012, 0.28, 0.22);
    },

    /* ── Success / payment ── */

    /* Validation success */
    success: function() {
      bellSeq([523, 659, 784, 1047], 2, 0.9, 0.085, 0.40, 90);
      silk(0.038, 0.14, 2400, 0.6);
    },

    /* Payment submit — solemn, confident */
    payment: function() {
      bell(220, 2, 2.5, 0.09, 0.60);
      bell(330, 1.5, 1.8, 0.075, 0.50, 0.16);
      setTimeout(function(){
        bellSeq([440, 554, 659, 880], 2, 0.8, 0.075, 0.38, 85);
      }, 300);
    },

    /* Triumph — merci-peman — grand, elegant */
    triumph: function() {
      /* Wave 1 */
      bellSeq([523, 659, 784], 2, 1.0, 0.09, 0.45, 80);
      /* Wave 2 */
      setTimeout(function(){
        bellSeq([784, 988, 1047], 2, 0.8, 0.075, 0.50, 80);
      }, 280);
      /* Crown bell */
      setTimeout(function(){
        bell(1047, 2.5, 1.5, 0.08, 0.80);
        silk(0.045, 0.20, 2800, 0.5);
      }, 580);
    },

    /* ── Market ── */

    shopBell: function() {
      bell(880, 3, 1.4, 0.085, 0.65);
      bell(1108, 3, 1.0, 0.055, 0.50, 0.14);
    },

    addCart: function() {
      seq([523, 659, 784], 'sine', 0.075, 70, 0.015, 0.008, 0.18);
      silk(0.030, 0.10, 2000, 0.7);
    },

    notify: function() {
      bell(740,  2, 0.9, 0.07, 0.30);
      bell(988,  2, 0.8, 0.05, 0.25, 0.13);
    }
  };

  /* ═══════════════════════════════════
     PAGE DETECTION
  ═══════════════════════════════════ */
  var PAGE = (function() {
    var p = (window.location.pathname.split('/').pop() || '').replace(/\?.*/, '');
    if (!p || p === 'index.html')          return 'index';
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
    /* Primary buttons */
    tap('.btn-glow,.btn-pri,.btn-pri-m,.nav-btn,.choice-btn,.primary', S.btnPrimary);
    on ('.btn-glow,.btn-pri,.btn-pri-m,.nav-btn,.choice-btn,.primary', 'mouseenter', S.hover);

    /* Secondary */
    tap('.btn-ghost,.btn-secondary,.btn-sec,.btn-ghost-m,.ghost', S.btnSecondary);
    on ('.btn-ghost,.btn-secondary,.btn-sec,.btn-ghost-m,.ghost', 'mouseenter', S.hover);

    /* Nav */
    on('.nav-links a,.footer-links a', 'mouseenter', S.hover);
    tap('.nav-links a', S.btnSecondary);

    /* Mobile menu */
    on('#hamburger,.hamburger', 'click', function() {
      var m = document.getElementById('mobileMenu');
      (m && m.classList.contains('open')) ? S.menuClose() : S.menuOpen();
    });

    /* Cards */
    on('.glass-card,.choice-card,.plan-card,.liv-card,.prod-card', 'mouseenter', S.cardHover);
    tap('.choice-card,.plan-card', S.cardSelect);

    /* FAQ */
    tap('.faq-q', function() {
      var item = this.parentElement || (this.closest && this.closest('.faq-item'));
      (item && item.classList.contains('open')) ? S.faqClose() : S.faqOpen();
    });

    /* Back to top */
    tap('#backTop,.back-top', S.backTop);

    /* Copy */
    tap('[data-copy],[class*="copy-btn"]', S.copy);

    /* Chat */
    on('.chat-btn', 'click', function() {
      var w = document.querySelector('.chat-window');
      (w && w.classList.contains('open')) ? S.chatClose() : S.chatOpen();
    });
    tap('.chat-send', S.msgSend);
    var ci = document.getElementById('chatInput');
    if (ci) ci.addEventListener('keydown', function(e){ if (e.key==='Enter') S.msgSend(); });

    var cm = document.getElementById('chatMsgs');
    if (cm && window.MutationObserver) {
      new MutationObserver(function(muts){
        muts.forEach(function(m){
          m.addedNodes.forEach(function(n){
            if (n.classList && n.classList.contains('bot')) S.msgRecv();
          });
        });
      }).observe(cm, { childList: true });
    }

    /* Section title woosh */
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting && !e.target._ws){ e.target._ws = true; S.woosh(); }
        });
      }, { threshold: 0.35 });
      q('.sec-title,.section-title').forEach(function(el){ io.observe(el); });
    }


  }

  function wirePage() {
    if (PAGE === 'index') {
      setTimeout(S.welcome, 600);
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

  window.KovaxSound = { play: S, enabled: function(){ return _on; } };

})();
