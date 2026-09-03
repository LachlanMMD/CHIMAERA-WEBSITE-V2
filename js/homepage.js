/**
 * CHIMAERA — homepage.js
 *
 * Scroll-driven atmosphere control.
 *
 * HERO 1:
 *   The atmosphere remains at its landing position (0.75)
 *   until HERO 1 begins entering the viewport.
 *
 *   From that point, the atmosphere gradually moves toward
 *   0.50 as the centre of HERO 1 approaches the centre of
 *   the viewport.
 *
 *   The transition uses an eased curve rather than linear
 *   interpolation.
 */

(function () {
  "use strict";

  function setup() {
    var atmosphere = window.ChimaeraAtmosphere && window.ChimaeraAtmosphere.main;

    var hero1 = document.querySelector(".homepage-hero");

    if (!atmosphere || !hero1) return;

    var ticking = false;

    /*
     * ----------------------------------------------------------
     * EASING
     * ----------------------------------------------------------
     */

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /*
     * ----------------------------------------------------------
     * SCROLL CALCULATION
     * ----------------------------------------------------------
     *
     * HERO 1:
     *
     * START:
     *   HERO1 begins entering the viewport.
     *
     * END:
     *   HERO1 centre reaches viewport centre.
     */

    function updateAtmosphere() {
      ticking = false;

      var rect = hero1.getBoundingClientRect();

      var viewportHeight = window.innerHeight;
      var viewportCentre = viewportHeight / 2;

      var transitionStart = viewportHeight;

      var heroCentre = rect.top + rect.height / 2;

      var transitionEnd = viewportCentre;

      var heroCentreAtStart = viewportHeight + rect.height / 2;

      var progress = (heroCentreAtStart - heroCentre) / (heroCentreAtStart - transitionEnd);

      progress = Math.max(0, Math.min(1, progress));

      var eased = easeInOutCubic(progress);

      /*
       * Send the scroll position to the persistent atmosphere.
       */

      if (typeof atmosphere.setScrollProgress === "function") {
        atmosphere.setScrollProgress(eased);
      }
    }

    function requestUpdate() {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(updateAtmosphere);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });

    window.addEventListener("resize", requestUpdate);

    /*
     * Establish the correct state immediately.
     */

    requestUpdate();

    /*
     * ============================================================
     * OPENING SEQUENCE
     * ============================================================
     *
     * The intro WebM is the master timeline.
     *
     * During the intro:
     *
     *   - landing page is hidden
     *   - header is hidden
     *   - atmosphere starts at midpoint 0.00
     *   - atmosphere moves toward 0.75
     *
     * When the intro ends:
     *
     *   - intro disappears
     *   - landing page becomes visible
     *   - atmosphere is already at 0.75
     *   - header is fully visible
     */

    var landing = document.querySelector(".landing");

    var intro = document.querySelector(".landing__gif");

    var header = document.querySelector(".site-header");

    if (landing && intro) {
      /*
       * ----------------------------------------------------------
       * OPENING TIMING
       * ----------------------------------------------------------
       *
       * ATMOSPHERE_DELAY:
       * How long after the intro starts before the atmosphere
       * begins moving from 0.00 toward 0.75.
       *
       * HEADER_DELAY:
       * How long after the intro starts before the header
       * begins fading in.
       */

      var ATMOSPHERE_DELAY = 500;
      var HEADER_DELAY = 1800;

      var atmosphereStarted = false;

      /*
       * ----------------------------------------------------------
       * START ATMOSPHERE
       * ----------------------------------------------------------
       */

      function startAtmosphere() {
        if (atmosphereStarted) return;

        atmosphereStarted = true;

        if (!atmosphere.beginOpeningTransition) {
          console.warn("Opening atmosphere API not available.");
          return;
        }

        var duration = intro.duration;

        /*
         * If metadata is not ready yet, fall back to
         * atmosphere.js's own opening duration default.
         */

        if (!isFinite(duration) || duration <= 0) {
          atmosphere.beginOpeningTransition(window.ChimaeraAtmosphere.OPENING_CONFIG.duration);
          return;
        }

        var remainingDuration = Math.max(0, duration * 1000 - ATMOSPHERE_DELAY);

        atmosphere.beginOpeningTransition(remainingDuration);
      }

      /*
       * ----------------------------------------------------------
       * START OPENING
       * ----------------------------------------------------------
       */

      function startOpening() {
        /*
         * Make absolutely sure the intro starts from frame 0.
         */

        intro.currentTime = 0;

        /*
         * Put the atmosphere back into its opening start state
         * explicitly, rather than trusting whatever it happened
         * to be left at (e.g. if something nudged it during the
         * async wait for includes/video readiness).
         */

        atmosphere.enterOpeningState();

        /*
         * Start atmosphere movement after the chosen delay.
         *
         * At the same moment, begin fading the header in.
         */

        window.setTimeout(function () {
          startAtmosphere();
        }, ATMOSPHERE_DELAY);

        window.setTimeout(function () {
          if (header) {
            header.classList.add("header--revealing");
          }
        }, HEADER_DELAY);
      }

      /*
       * ----------------------------------------------------------
       * INTRO COMPLETE
       * ----------------------------------------------------------
       */

      intro.addEventListener("ended", function () {
        /*
         * The intro WebM's own "ended" event is the single
         * authoritative signal that the opening has finished.
         * Tell the atmosphere explicitly, rather than relying
         * on a timer of its own.
         */

        atmosphere.finishOpeningState();

        /*
         * Reveal the actual landing page.
         */

        landing.classList.add("landing--revealed");
      });

      /*
       * ----------------------------------------------------------
       * BEGIN
       * ----------------------------------------------------------
       */

      if (intro.readyState >= 2) {
        startOpening();
      } else {
        intro.addEventListener("loadeddata", startOpening, { once: true });
      }
    }
  }

  /*
   * ------------------------------------------------------------
   * BOOTSTRAP
   * ------------------------------------------------------------
   *
   * Wait until atmosphere.js has created the persistent
   * atmosphere object.
   */

  function boot() {
    if (window.ChimaeraAtmosphere && window.ChimaeraAtmosphere.main) {
      setup();
    } else {
      window.setTimeout(boot, 50);
    }
  }

  document.addEventListener("chimaera:includes-loaded", boot, { once: true });
})();
