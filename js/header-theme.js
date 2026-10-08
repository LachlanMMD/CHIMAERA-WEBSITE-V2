/**
 * CHIMAERA — header-theme.js
 * The header is fixed and the page underneath it alternates between the
 * coral atmosphere and pale editorial fields. Rather than one fixed logo
 * colour (which disappears against half the site), the wordmark and the
 * star each independently sample the element behind their own position
 * and switch ink: "on-dark" (render light/white) over coral or photography,
 * "on-light" (render coral) over a pale field.
 */
(function () {
  'use strict';

  var LUMINANCE_THRESHOLD = 0.72; // above this, the point reads as "light" — needs dark/coral ink

  function inkFor(el, x, y) {
    if (!el) return 'on-dark';
    var field = el.closest('[data-field]');
    if (!field) return 'on-dark';

    // Over the live atmosphere, sample the actual rendered pixel — the
    // pale bloom drifts, so a fixed "this whole section is coral" label
    // isn't reliable at the exact point the header sits. .landing is the
    // homepage's opening section; .field-atmosphere is the general-purpose
    // opt-in for any other section that shows the raw atmosphere (see
    // css/global.css) rather than a solid field colour.
    if ((field.classList.contains('landing') || field.classList.contains('field-atmosphere')) && window.ChimaeraAtmosphere) {
      var luminance = window.ChimaeraAtmosphere.getLuminanceAt(x, y);
      if (luminance !== null) {
        return luminance > LUMINANCE_THRESHOLD ? 'on-light' : 'on-dark';
      }
    }

    return field.getAttribute('data-field') === 'pale' ? 'on-light' : 'on-dark';
  }

  function setup() {
    var wordmark = document.querySelector('.site-header__wordmark');
    var star = document.getElementById('nav-trigger');
    var header = document.querySelector('.site-header');
    if (!wordmark || !star || !header) return;

    var ticking = false;

    function sample() {
      ticking = false;
      var rect = header.getBoundingClientRect();
      var y = Math.max(1, rect.top + rect.height / 2);

      var leftX = 24;
      var rightX = window.innerWidth - 40;
      var leftPoint = document.elementFromPoint(leftX, y);
      var rightPoint = document.elementFromPoint(rightX, y);

      wordmark.setAttribute('data-ink', inkFor(leftPoint, leftX, y));
      star.setAttribute('data-ink', inkFor(rightPoint, rightX, y));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sample);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sample();

    // The atmosphere keeps drifting even when the page doesn't scroll, so
    // re-sample on a slow interval too (cheap: a 1x1 canvas read).
    window.setInterval(sample, 2500);
  }

  if (document.querySelector('[data-include]')) {
    document.addEventListener('chimaera:includes-loaded', setup);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
