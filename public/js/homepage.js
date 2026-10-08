/**
 * CHIMAERA — homepage.js
 *
 * Scroll-driven atmosphere control.
 *
 *   Each homepage section has a coverage stop (STOPS below).
 *   As the viewport centre travels between two sections'
 *   centres, the midpoint eases from one stop to the next.
 *   The atmosphere's own idle breath, wobble and mouse response
 *   run on top of this (js/atmosphere.js).
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

    /*
     * ----------------------------------------------------------
     * SECTION STOPS
     * ----------------------------------------------------------
     *
     * Atmosphere midpoint per section (0 = all pale, 1 = all coral).
     * Between two sections, the midpoint eases from one value to the
     * next as the viewport centre travels between their centres.
     * Edit the numbers to tune; add a row to add a section.
     * Spec: docs/HOMEPAGE-SPEC.md §4.1.
     */

    var STOPS = [
      { selector: ".landing", midpoint: 0.75 },
      { selector: "#idea", midpoint: 0.5 },
      { selector: "#artist", midpoint: 0.5 },
      { selector: "#people", midpoint: 0.5 },
      { selector: "#practice", midpoint: 0.5 },
      { selector: "#events", midpoint: 0.75 },
    ];

    function midpointForScroll() {
      var viewportCentre = window.innerHeight / 2;
      var points = [];

      STOPS.forEach(function (stop) {
        var el = document.querySelector(stop.selector);
        if (!el) return;

        var rect = el.getBoundingClientRect();
        points.push({ centre: rect.top + rect.height / 2, midpoint: stop.midpoint });
      });

      if (!points.length) return null;

      if (viewportCentre <= points[0].centre) return points[0].midpoint;

      for (var i = 0; i < points.length - 1; i++) {
        var a = points[i];
        var b = points[i + 1];

        if (viewportCentre >= a.centre && viewportCentre <= b.centre) {
          var t = (viewportCentre - a.centre) / (b.centre - a.centre);
          return a.midpoint + (b.midpoint - a.midpoint) * easeInOutCubic(t);
        }
      }

      return points[points.length - 1].midpoint;
    }

    function updateAtmosphere() {
      ticking = false;

      var midpoint = midpointForScroll();

      if (midpoint !== null && typeof atmosphere.setColourMidpoint === "function") {
        atmosphere.setColourMidpoint(midpoint);
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

      /*
       * ----------------------------------------------------------
       * INTRO COMPLETE
       * ----------------------------------------------------------
       */

      var openingCompleted = false;

      function completeOpening() {
        /*
         * Guarded so this can safely run from both the "ended"
         * handler and the play()-rejection fallback in
         * startOpening() below without finishing the opening twice.
         */

        if (openingCompleted) return;

        openingCompleted = true;

        /*
         * The intro WebM's own "ended" event is normally the single
         * authoritative signal that the opening has finished. Tell
         * the atmosphere explicitly, rather than relying on a timer
         * of its own.
         */

        /*
         * Reveal the actual landing page FIRST: the content must never
         * depend on the background drawing successfully.
         */

        landing.classList.add("landing--revealed");

        try {
          atmosphere.finishOpeningState();
        } catch (error) {
          console.error("Atmosphere: finishOpeningState failed", error);
        }
      }

      intro.addEventListener("ended", completeOpening);

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
         * Explicitly start playback rather than relying solely on
         * the `autoplay` attribute. Attribute-driven autoplay has
         * proven unreliable in practice (e.g. a fresh origin with no
         * prior media engagement can silently leave the video paused
         * at frame 0 even though readyState reaches HAVE_ENOUGH_DATA)
         * — and since "ended" is the only signal that completes the
         * opening, a video that never plays leaves the whole page
         * stuck showing nothing but the atmosphere's 0.00 start
         * state. If the browser still refuses playback outright (a
         * genuine autoplay policy block), skip the intro gracefully
         * instead of leaving the page frozen.
         */

        var playResult = intro.play();

        if (playResult && typeof playResult.catch === "function") {
          playResult.catch(function () {
            completeOpening();
          });
        }

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
