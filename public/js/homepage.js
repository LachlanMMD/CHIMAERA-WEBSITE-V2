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

      if (thread) thread.update();
    }

    function requestUpdate() {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(updateAtmosphere);
    }

    /*
     * ----------------------------------------------------------
     * THREAD
     * ----------------------------------------------------------
     *
     * Dashed line through 02–04, ending at the top of 05.
     * Spec: docs/HOMEPAGE-SPEC.md §6.
     *
     *   - Path: smooth curve (Catmull-Rom → cubic Béziers) through
     *     every [data-thread-anchor] in page order. The attribute is
     *     "x,y" as a fraction of that element's box, so "1.1,0.5"
     *     = just right of the element, halfway down. Move the line
     *     by editing those numbers in src/pages/index.astro.
     *   - Draw-on: a solid copy of the path inside a <mask>; its
     *     dash offset follows scroll through .thread-wrap. The tip
     *     sits at --thread-lead of the viewport height.
     *   - Rebuilt on width change only (debounced), plus once fonts
     *     and images have settled.
     *   - Desktop only (≥64rem, matches the CSS). Reduced motion:
     *     drawn in full, static.
     */

    var thread = setupThread();

    function setupThread() {
      var wrap = document.querySelector("[data-thread]");
      var svg = wrap && wrap.querySelector(".thread");

      if (!svg || typeof svg.createSVGPoint !== "function") return null;

      var NS = "http://www.w3.org/2000/svg";
      var desktop = window.matchMedia("(min-width: 64rem)");
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

      var lead = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--thread-lead")) || 0.75;

      svg.innerHTML =
        '<defs><mask id="thread-mask" maskUnits="userSpaceOnUse">' +
        '<path class="thread__reveal"></path>' +
        "</mask></defs>" +
        '<path class="thread__line" mask="url(#thread-mask)"></path>';

      var mask = svg.querySelector("mask");
      var reveal = svg.querySelector(".thread__reveal");
      var line = svg.querySelector(".thread__line");

      var length = 0;
      var built = false;

      function anchorPoints() {
        var origin = wrap.getBoundingClientRect();

        return Array.prototype.map.call(document.querySelectorAll("[data-thread-anchor]"), function (el) {
          var f = el.getAttribute("data-thread-anchor").split(",").map(Number);
          var r = el.getBoundingClientRect();

          return [r.left - origin.left + r.width * (f[0] || 0), r.top - origin.top + r.height * (f[1] || 0)];
        });
      }

      /*
       * Catmull-Rom tangent (next − prev) / 6, capped at a third of
       * the segment it bends, so a long neighbouring segment can't
       * swing a short one out through the copy.
       */
      function handle(from, to, prev, next) {
        var tx = (next[0] - prev[0]) / 6;
        var ty = (next[1] - prev[1]) / 6;
        var max = Math.hypot(to[0] - from[0], to[1] - from[1]) / 3;
        var len = Math.hypot(tx, ty);
        var k = len > max ? max / len : 1;

        return [tx * k, ty * k];
      }

      function pathThrough(p) {
        var d = "M " + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);

        for (var i = 0; i < p.length - 1; i++) {
          var a = p[i - 1] || p[i];
          var b = p[i];
          var c = p[i + 1];
          var e = p[i + 2] || c;

          var h1 = handle(b, c, a, c);
          var h2 = handle(b, c, b, e);

          d +=
            " C " +
            (b[0] + h1[0]).toFixed(1) + " " + (b[1] + h1[1]).toFixed(1) + ", " +
            (c[0] - h2[0]).toFixed(1) + " " + (c[1] - h2[1]).toFixed(1) + ", " +
            c[0].toFixed(1) + " " + c[1].toFixed(1);
        }

        return d;
      }

      function build() {
        built = false;

        if (!desktop.matches) return;

        var points = anchorPoints();
        if (points.length < 2) return;

        var w = wrap.clientWidth;
        var h = wrap.offsetHeight;

        svg.setAttribute("viewBox", "0 0 " + w + " " + h);

        mask.setAttribute("x", -w);
        mask.setAttribute("y", -h);
        mask.setAttribute("width", w * 3);
        mask.setAttribute("height", h * 3);

        var d = pathThrough(points);
        line.setAttribute("d", d);
        reveal.setAttribute("d", d);

        length = line.getTotalLength();
        reveal.style.strokeDasharray = length + " " + length;

        built = true;
        update();
      }

      function update() {
        if (!built) return;

        var progress = 1;

        if (!reduced.matches) {
          var r = wrap.getBoundingClientRect();
          progress = Math.min(1, Math.max(0, (window.innerHeight * lead - r.top) / r.height));
        }

        reveal.style.strokeDashoffset = length * (1 - progress);
      }

      var lastWidth = window.innerWidth;
      var resizeTimer = null;

      window.addEventListener("resize", function () {
        if (window.innerWidth === lastWidth) return;

        lastWidth = window.innerWidth;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(build, 150);
      });

      if (desktop.addEventListener) desktop.addEventListener("change", build);
      if (reduced.addEventListener) reduced.addEventListener("change", update);

      if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
      window.addEventListener("load", build);

      build();

      return { update: update };
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
