/**
 * CHIMAERA — atmosphere.js
 *
 * PERSISTENT ATMOSPHERE
 *
 * STATES
 *
 * OPENING
 *   Starts at midpoint 0.00.
 *   Moves organically toward 0.75.
 *   Scroll is locked out during this sequence.
 *
 * LANDING
 *   Midpoint 0.75.
 *
 * HERO / FIRST EDITORIAL SECTION
 *   Midpoint 0.50.
 *   Scroll gradually moves the atmosphere from 0.75 → 0.50.
 *
 * NAV
 *   Midpoint 0.50.
 *   Slower / calmer movement.
 *
 * IMPORTANT
 *   The opening state is authoritative until the opening
 *   transition has completed. This prevents homepage scroll
 *   code from immediately overriding the 0.00 starting point.
 */

(function () {
  "use strict";

  // ============================================================
  // DEFAULT / LANDING STATE
  // ============================================================

  var DEFAULT_CONFIG = {
    coral: "#e35039",
    pale: "#f1f6f8",

    colourMidpointX: 0.75,
    organicDeviation: 0.04,

    verticalPosition: 0.5,

    coralIntensity: 1,
    opacity: 1,

    movementSpeed: 25,
    movementAmplitude: 1.5,

    mouseInfluence: 0.08,
    mouseSmoothing: 0.05,

    softness: 1,
    scale: 1,
    maxFPS: 60,

    /*
     * IDLE BREATH + GLOBAL MULTIPLIERS
     *
     * Applied on top of whichever state config is active, so the
     * field keeps breathing through every transition.
     * All of these can be overridden from css/tokens.css
     * (--atmosphere-* tokens, read once in init()).
     */

    breathAmplitude: 0.03, // midpoint swing, fraction of width
    breathPeriod: 8, // seconds per full breath
    breathSoftness: 0.2, // how much the edge softness breathes

    speedScale: 1,
    amplitudeScale: 1,
    softnessScale: 1,
    mouseScale: 1,
  };

  // ============================================================
  // OPENING START
  // ============================================================

  var OPENING_START_CONFIG = {
    colourMidpointX: 0.0,

    organicDeviation: 0.018,

    verticalPosition: 0.5,

    coralIntensity: 1,
    opacity: 1,

    movementSpeed: 10,
    movementAmplitude: 0.55,

    mouseInfluence: 0,
    mouseSmoothing: 0.05,

    softness: 1.1,
    scale: 1,
    maxFPS: 60,
  };

  // ============================================================
  // OPENING END / LANDING
  // ============================================================

  var OPENING_END_CONFIG = {
    colourMidpointX: 0.75,

    organicDeviation: 0.04,

    verticalPosition: 0.5,

    coralIntensity: 1,
    opacity: 1,

    movementSpeed: 25,
    movementAmplitude: 1.5,

    mouseInfluence: 0.08,
    mouseSmoothing: 0.05,

    softness: 1,
    scale: 1,
    maxFPS: 60,
  };

  // ============================================================
  // HERO / FIRST EDITORIAL STATE
  // ============================================================

  var HERO_CONFIG = {
    colourMidpointX: 0.5,

    organicDeviation: 0.035,

    verticalPosition: 0.5,

    coralIntensity: 1,
    opacity: 1,

    movementSpeed: 20,
    movementAmplitude: 1.15,

    mouseInfluence: 0.055,
    mouseSmoothing: 0.045,

    softness: 1,
    scale: 1,
    maxFPS: 60,
  };

  // ============================================================
  // NAVIGATION STATE
  // ============================================================

  var NAV_CONFIG = {
    colourMidpointX: 0.5,

    organicDeviation: 0.014,

    verticalPosition: 0.5,

    coralIntensity: 1,
    opacity: 1,

    movementSpeed: 8,
    movementAmplitude: 0.65,

    mouseInfluence: 0.018,
    mouseSmoothing: 0.035,

    softness: 1.2,
    scale: 1,
    maxFPS: 60,
  };

  // ============================================================
  // OPENING DURATION
  // ============================================================

  var OPENING_DURATION = 3200;

  // ============================================================
  // GLOBAL CONFIG
  // ============================================================

  var config = Object.assign({}, DEFAULT_CONFIG, window.ChimaeraAtmosphereConfig || {});

  // ============================================================
  // HELPERS
  // ============================================================

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function easeInOutCubic(amount) {
    return amount < 0.5 ? 4 * amount * amount * amount : 1 - Math.pow(-2 * amount + 2, 3) / 2;
  }

  // ============================================================
  // ORGANIC NOISE
  // ============================================================

  function hashNoise(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;

    return x - Math.floor(x);
  }

  function smoothNoise(x) {
    var i = Math.floor(x);
    var f = x - i;

    var a = hashNoise(i);
    var b = hashNoise(i + 1);

    var u = f * f * (3 - 2 * f);

    return lerp(a, b, u) * 2 - 1;
  }

  // ============================================================
  // COLOUR
  // ============================================================

  function hexToRgb(hex) {
    var h = hex.replace("#", "");

    if (h.length === 3) {
      h = h
        .split("")
        .map(function (c) {
          return c + c;
        })
        .join("");
    }

    var num = parseInt(h, 16);

    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function rgba(hex, alpha) {
    var c = hexToRgb(hex);

    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + Math.max(0, alpha) + ")";
  }

  // ============================================================
  // MOTION PREFERENCES
  // ============================================================

  var FROZEN_T = 4200;

  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var POINTER_FINE = window.matchMedia("(pointer: fine)").matches;

  // ============================================================
  // SHARED MOUSE
  // ============================================================

  var rawMouse = {
    x: 0,
    y: 0,
    active: false,
  };

  var smoothedMouse = {
    x: 0,
    y: 0,
  };

  if (POINTER_FINE && !REDUCED_MOTION) {
    smoothedMouse.x = window.innerWidth / 2;

    smoothedMouse.y = window.innerHeight / 2;

    window.addEventListener(
      "mousemove",
      function (e) {
        rawMouse.x = e.clientX;
        rawMouse.y = e.clientY;
        rawMouse.active = true;
      },
      {
        passive: true,
      },
    );

    (function tickMouseSmoothing() {
      if (rawMouse.active) {
        smoothedMouse.x += (rawMouse.x - smoothedMouse.x) * config.mouseSmoothing;

        smoothedMouse.y += (rawMouse.y - smoothedMouse.y) * config.mouseSmoothing;
      }

      requestAnimationFrame(tickMouseSmoothing);
    })();
  }

  function getMouseOffset(width, height, mouseInfluence) {
    if (!POINTER_FINE || REDUCED_MOTION || !rawMouse.active) {
      return {
        dxFrac: 0,
        dyFrac: 0,
      };
    }

    var maxDispFrac = 0.045;

    var dxFrac = ((smoothedMouse.x - width / 2) / width) * mouseInfluence;

    var dyFrac = ((smoothedMouse.y - height / 2) / height) * mouseInfluence;

    return {
      dxFrac: clamp(dxFrac, -maxDispFrac, maxDispFrac),

      dyFrac: clamp(dyFrac, -maxDispFrac, maxDispFrac),
    };
  }

  // ============================================================
  // ATMOSPHERE RENDERER
  // ============================================================

  function mountAtmosphere(canvas, options) {
    if (!canvas) return null;

    options = options || {};

    var ctx = canvas.getContext("2d");

    var width = 0;
    var height = 0;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // ==========================================================
    // INITIAL CONFIGURATION
    // ==========================================================

    var currentConfig;

    /*
     * IMPORTANT:
     *
     * If this is the main opening atmosphere,
     * explicitly start at OPENING_START_CONFIG.
     *
     * Do NOT merge DEFAULT_CONFIG here.
     *
     * This guarantees that the first rendered frame
     * is midpoint 0.00.
     */

    if (options.opening) {
      currentConfig = Object.assign({}, OPENING_START_CONFIG);
    } else {
      currentConfig = Object.assign({}, config);
    }

    var targetConfig = Object.assign({}, currentConfig);

    var transitionFrom = null;

    var transitionStart = 0;

    var transitionDuration = 1800;

    var transitioning = false;

    /*
     * OPENING LOCK
     *
     * While true, scroll-driven calls cannot alter
     * the atmosphere.
     */

    var openingActive = !!options.opening;

    // ==========================================================
    // LOW RESOLUTION BUFFER
    // ==========================================================

    var buffer = document.createElement("canvas");

    var bctx = buffer.getContext("2d");

    var blurred = document.createElement("canvas");

    var blurCtx = blurred.getContext("2d");

    var bufferW = 0;
    var bufferH = 0;

    var BUFFER_LONGEST_EDGE = 200;

    // ==========================================================
    // RESIZE
    // ==========================================================

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);

      canvas.height = Math.round(height * dpr);

      canvas.style.width = width + "px";

      canvas.style.height = height + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.imageSmoothingEnabled = true;

      if (width >= height) {
        bufferW = BUFFER_LONGEST_EDGE;

        bufferH = Math.max(24, Math.round(BUFFER_LONGEST_EDGE * (height / width)));
      } else {
        bufferH = BUFFER_LONGEST_EDGE;

        bufferW = Math.max(24, Math.round(BUFFER_LONGEST_EDGE * (width / height)));
      }

      buffer.width = bufferW;
      buffer.height = bufferH;

      blurred.width = bufferW;
      blurred.height = bufferH;

      if (REDUCED_MOTION) {
        drawFrame(FROZEN_T);
      }
    }

    var HAS_CANVAS_FILTER = typeof bctx.filter === "string";

    // ==========================================================
    // TRANSITION STATE
    // ==========================================================

    function getCurrentAnimatedConfig(now) {
      if (!transitioning || !transitionFrom) {
        return currentConfig;
      }

      var progress = clamp((now - transitionStart) / transitionDuration, 0, 1);

      var eased = easeInOutCubic(progress);

      return {
        colourMidpointX: lerp(transitionFrom.colourMidpointX, targetConfig.colourMidpointX, eased),

        organicDeviation: lerp(transitionFrom.organicDeviation, targetConfig.organicDeviation, eased),

        verticalPosition: lerp(transitionFrom.verticalPosition, targetConfig.verticalPosition, eased),

        movementSpeed: lerp(transitionFrom.movementSpeed, targetConfig.movementSpeed, eased),

        movementAmplitude: lerp(transitionFrom.movementAmplitude, targetConfig.movementAmplitude, eased),

        mouseInfluence: lerp(transitionFrom.mouseInfluence, targetConfig.mouseInfluence, eased),

        mouseSmoothing: lerp(transitionFrom.mouseSmoothing, targetConfig.mouseSmoothing, eased),

        softness: lerp(transitionFrom.softness, targetConfig.softness, eased),
      };
    }

    function transitionTo(nextConfig, duration) {
      var now = performance.now();

      var animated = getCurrentAnimatedConfig(now);

      transitionFrom = {
        colourMidpointX: animated.colourMidpointX,

        organicDeviation: animated.organicDeviation,

        verticalPosition: animated.verticalPosition,

        movementSpeed: animated.movementSpeed,

        movementAmplitude: animated.movementAmplitude,

        mouseInfluence: animated.mouseInfluence,

        mouseSmoothing: animated.mouseSmoothing,

        softness: animated.softness,
      };

      targetConfig = Object.assign({}, currentConfig, nextConfig);

      transitionDuration = duration || 1800;

      transitionStart = now;

      transitioning = true;
    }

    function finishTransitionIfNeeded(now) {
      if (!transitioning) {
        return;
      }

      if (now - transitionStart >= transitionDuration) {
        currentConfig = Object.assign({}, currentConfig, targetConfig);

        transitioning = false;

        transitionFrom = null;
      }
    }

    // ==========================================================
    // DRAW
    // ==========================================================

    function drawFrame(t) {
      var animated = getCurrentAnimatedConfig(t);

      var s = animated.movementSpeed * config.speedScale;

      var effDeviationFrac = animated.organicDeviation * animated.movementAmplitude * config.amplitudeScale;

      var mouse = getMouseOffset(width, height, animated.mouseInfluence * config.mouseScale);

      var time = t * 0.001;

      // ========================================================
      // IDLE BREATH
      // ========================================================

      var breath = REDUCED_MOTION || !(config.breathPeriod > 0) ? 0 : Math.sin((time / config.breathPeriod) * Math.PI * 2);

      var breathFrac = breath * config.breathAmplitude;

      var softness = animated.softness * config.softnessScale * (1 + breath * config.breathSoftness);

      var motionScale = s / 25;

      // ========================================================
      // GLOBAL ORGANIC DRIFT
      // ========================================================

      var driftLarge = smoothNoise(time * 0.075 * motionScale) * 0.62;

      var driftMedium = smoothNoise(time * 0.17 * motionScale + 13.7) * 0.26;

      var driftSmall = smoothNoise(time * 0.38 * motionScale + 29.4) * 0.12;

      var globalSwayFrac = effDeviationFrac * (driftLarge + driftMedium + driftSmall);

      // ========================================================
      // SOFTNESS
      // ========================================================

      var featherFrac = clamp(0.1 * softness, 0.03, 0.3);

      var featherPx = featherFrac * bufferW;

      // ========================================================
      // BASE CORAL
      // ========================================================

      bctx.globalAlpha = 1;

      bctx.fillStyle = rgba(config.coral, config.coralIntensity);

      bctx.fillRect(0, 0, bufferW, bufferH);

      // ========================================================
      // ORGANIC BOUNDARY
      // ========================================================

      for (var y = 0; y < bufferH; y++) {
        var yFrac = y / bufferH;

        var noiseLarge = smoothNoise(yFrac * 2.2 + time * 0.075 * motionScale);

        var noiseMedium = smoothNoise(yFrac * 5.1 - time * 0.13 * motionScale + 17.3);

        var noiseSmall = smoothNoise(yFrac * 11.0 + time * 0.21 * motionScale + 41.7);

        var wobbleFrac = effDeviationFrac * (noiseLarge * 0.68 + noiseMedium * 0.24 + noiseSmall * 0.08);

        var verticalTilt = (yFrac - animated.verticalPosition) * effDeviationFrac * 0.35;

        // ======================================================
        // MIDPOINT
        // ======================================================

        var centerXFrac = animated.colourMidpointX + globalSwayFrac + breathFrac + wobbleFrac + verticalTilt + mouse.dxFrac;

        centerXFrac = clamp(centerXFrac, 0.04, 0.96);

        var centerXpx = centerXFrac * bufferW;

        // ======================================================
        // IRREGULAR FEATHERING
        // ======================================================

        var featherNoise = smoothNoise(yFrac * 4.3 + time * 0.045 * motionScale + 83.1);

        var featherPxI = featherPx * (0.88 + 0.18 * featherNoise);

        var leftX = Math.max(0, centerXpx - featherPxI);

        var rightX = Math.min(bufferW, centerXpx + featherPxI);

        var rowH = y === bufferH - 1 ? bufferH - y : 1.02;

        // ======================================================
        // FEATHERED TRANSITION
        // ======================================================

        if (rightX > leftX) {
          var grad = bctx.createLinearGradient(leftX, 0, rightX, 0);

          grad.addColorStop(0, rgba(config.pale, 0));

          grad.addColorStop(1, rgba(config.pale, 0.97));

          bctx.fillStyle = grad;

          bctx.fillRect(leftX, y, rightX - leftX, rowH);
        }

        // ======================================================
        // PALE SIDE
        // ======================================================

        if (rightX < bufferW) {
          bctx.fillStyle = rgba(config.pale, 0.97);

          bctx.fillRect(rightX, y, bufferW - rightX, rowH);
        }
      }

      // ========================================================
      // BLUR
      // ========================================================

      var src = buffer;

      if (HAS_CANVAS_FILTER) {
        var blurPx = clamp(1.6 * softness, 0.4, 6);

        blurCtx.clearRect(0, 0, bufferW, bufferH);

        blurCtx.filter = "blur(" + blurPx + "px)";

        blurCtx.drawImage(buffer, 0, 0);

        blurCtx.filter = "none";

        src = blurred;
      }

      // ========================================================
      // UPSCALE
      // ========================================================

      ctx.clearRect(0, 0, width, height);

      ctx.drawImage(src, 0, 0, bufferW, bufferH, 0, 0, width, height);

      finishTransitionIfNeeded(t);
    }

    // ==========================================================
    // ANIMATION LOOP
    // ==========================================================

    resize();

    window.addEventListener("resize", resize);

    canvas.style.opacity = String(config.opacity);

    var minFrameTime = 1000 / config.maxFPS;

    var lastFrameTime = 0;

    var rafId = null;

    var running = false;

    function loop(now) {
      if (!running) {
        return;
      }

      rafId = requestAnimationFrame(loop);

      if (now - lastFrameTime < minFrameTime) {
        return;
      }

      lastFrameTime = now;

      drawFrame(now);
    }

    function start() {
      if (REDUCED_MOTION) {
        drawFrame(FROZEN_T);

        return;
      }

      if (running) {
        return;
      }

      running = true;

      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;

      if (rafId) {
        cancelAnimationFrame(rafId);

        rafId = null;
      }
    }

    // ==========================================================
    // VISIBILITY
    // ==========================================================

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else if (options.autoStart !== false) {
        start();
      }
    });

    if (REDUCED_MOTION) {
      drawFrame(FROZEN_T);
    } else if (options.autoStart !== false) {
      start();
    }

    // ==========================================================
    // PUBLIC API
    // ==========================================================

    var handle = {
      resize: resize,

      start: start,

      stop: stop,

      transitionTo: transitionTo,

      // --------------------------------------------------------
      // SCROLL
      // --------------------------------------------------------

      setScrollProgress: function (progress) {
        /*
         * CRITICAL:
         *
         * While the intro is playing, scroll is NOT allowed
         * to change the atmosphere.
         *
         * This is what prevents the initial 0.00 state from
         * being immediately overwritten with 0.75.
         */

        if (openingActive) {
          return;
        }

        progress = clamp(progress, 0, 1);

        /*
         * Once the opening has finished:
         *
         *   progress 0 = landing = 0.75
         *   progress 1 = hero = 0.50
         */

        currentConfig = Object.assign({}, currentConfig, {
          colourMidpointX: lerp(OPENING_END_CONFIG.colourMidpointX, HERO_CONFIG.colourMidpointX, progress),

          organicDeviation: lerp(OPENING_END_CONFIG.organicDeviation, HERO_CONFIG.organicDeviation, progress),

          movementSpeed: lerp(OPENING_END_CONFIG.movementSpeed, HERO_CONFIG.movementSpeed, progress),

          movementAmplitude: lerp(OPENING_END_CONFIG.movementAmplitude, HERO_CONFIG.movementAmplitude, progress),

          mouseInfluence: lerp(OPENING_END_CONFIG.mouseInfluence, HERO_CONFIG.mouseInfluence, progress),

          mouseSmoothing: lerp(OPENING_END_CONFIG.mouseSmoothing, HERO_CONFIG.mouseSmoothing, progress),

          softness: lerp(OPENING_END_CONFIG.softness, HERO_CONFIG.softness, progress),
        });

        transitioning = false;

        transitionFrom = null;

        drawFrame(performance.now());
      },

      // --------------------------------------------------------
      // SET MIDPOINT DIRECTLY (per-section scroll stops)
      // --------------------------------------------------------

      setColourMidpoint: function (x) {
        if (openingActive) {
          return;
        }

        currentConfig = Object.assign({}, currentConfig, {
          colourMidpointX: clamp(x, 0, 1),
        });

        transitioning = false;

        transitionFrom = null;

        if (REDUCED_MOTION) {
          drawFrame(FROZEN_T);
        }
      },

      // --------------------------------------------------------
      // OPENING
      // --------------------------------------------------------

      enterOpeningState: function () {
        /*
         * Opening becomes authoritative immediately.
         */

        openingActive = true;

        /*
         * Force the atmosphere back to EXACTLY 0.00.
         *
         * This matters if something else touched the
         * atmosphere before this function was called.
         */

        currentConfig = Object.assign({}, OPENING_START_CONFIG);

        targetConfig = Object.assign({}, OPENING_START_CONFIG);

        transitionFrom = null;

        transitioning = false;
      },

      // --------------------------------------------------------
      // OPENING TRANSITION
      // --------------------------------------------------------

      beginOpeningTransition: function (duration) {
        /*
         * Start the 0.00 → 0.75 transition.
         *
         * This only animates the visual sweep. It does NOT
         * decide when the opening has finished — the caller
         * (homepage.js) is responsible for calling
         * finishOpeningState() explicitly, driven by the intro
         * WebM's own "ended" event. Atmosphere never times this
         * out on its own.
         */

        transitionTo(OPENING_END_CONFIG, duration || OPENING_DURATION);

        start();
      },

      // --------------------------------------------------------
      // EXPLICIT OPENING COMPLETION
      // --------------------------------------------------------

      finishOpeningState: function () {
        /*
         * Authoritative "opening is over" signal. Called by
         * homepage.js in response to the intro WebM's native
         * "ended" event — atmosphere.js itself never decides
         * this via a timer.
         */

        currentConfig = Object.assign({}, OPENING_END_CONFIG);

        targetConfig = Object.assign({}, OPENING_END_CONFIG);

        transitionFrom = null;

        transitioning = false;

        openingActive = false;

        drawFrame(performance.now());
      },

      // --------------------------------------------------------
      // HERO
      // --------------------------------------------------------

      enterHeroState: function (duration) {
        if (openingActive) {
          return;
        }

        transitionTo(HERO_CONFIG, duration || 1400);

        start();
      },

      // --------------------------------------------------------
      // NAVIGATION
      // --------------------------------------------------------

      enterNavState: function (duration) {
        transitionTo(NAV_CONFIG, duration || 1800);

        start();
      },

      // --------------------------------------------------------
      // RETURN TO LANDING
      // --------------------------------------------------------

      enterLandingState: function (duration) {
        if (openingActive) {
          return;
        }

        transitionTo(DEFAULT_CONFIG, duration || 1800);

        start();
      },
    };

    // ==========================================================
    // GLOBAL API
    // ==========================================================

    if (options.exposeGlobal) {
      window.ChimaeraAtmosphere = window.ChimaeraAtmosphere || {};

      window.ChimaeraAtmosphere.getLuminanceAt = function (clientX, clientY) {
        try {
          var x = Math.max(0, Math.min(width - 1, clientX));

          var y = Math.max(0, Math.min(height - 1, clientY));

          var data = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data;

          return (0.299 * data[0] + 0.587 * data[1] + 0.114 * data[2]) / 255;
        } catch (e) {
          return null;
        }
      };
    }

    return handle;
  }

  // ============================================================
  // INITIALISE
  // ============================================================

  // ============================================================
  // TOKEN OVERRIDES (css/tokens.css → config)
  // ============================================================

  /*
   * Reads the --atmosphere-* custom properties once. A missing or
   * invalid token keeps the JS default above.
   */

  function applyTokenOverrides() {
    var styles = window.getComputedStyle(document.documentElement);

    function read(name) {
      return styles.getPropertyValue(name).trim();
    }

    function num(name, key) {
      var v = parseFloat(read(name));

      if (isFinite(v)) config[key] = v;
    }

    function colour(name, key) {
      var v = read(name);

      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) config[key] = v;
    }

    colour("--atmosphere-coral", "coral");
    colour("--atmosphere-pale", "pale");

    num("--atmosphere-coral-intensity", "coralIntensity");
    num("--atmosphere-opacity", "opacity");

    num("--atmosphere-speed", "speedScale");
    num("--atmosphere-amplitude", "amplitudeScale");
    num("--atmosphere-softness", "softnessScale");
    num("--atmosphere-mouse", "mouseScale");

    num("--atmosphere-breath", "breathAmplitude");
    num("--atmosphere-breath-period", "breathPeriod");
    num("--atmosphere-breath-softness", "breathSoftness");
  }

  function init() {
    applyTokenOverrides();

    var mainCanvas = document.getElementById("atmosphere-canvas");

    var navCanvas = document.getElementById("nav-atmosphere-canvas");

    // ----------------------------------------------------------
    // MAIN ATMOSPHERE
    // ----------------------------------------------------------

    var main = mountAtmosphere(mainCanvas, {
      exposeGlobal: true,
      autoStart: true,
      opening: true,
    });

    // ----------------------------------------------------------
    // NAV ATMOSPHERE
    // ----------------------------------------------------------

    var nav = mountAtmosphere(navCanvas, {
      exposeGlobal: false,
      autoStart: false,
    });

    window.ChimaeraAtmosphere = window.ChimaeraAtmosphere || {};

    window.ChimaeraAtmosphere.main = main;

    window.ChimaeraAtmosphere.nav = nav;

    window.ChimaeraAtmosphere.NAV_CONFIG = NAV_CONFIG;

    window.ChimaeraAtmosphere.OPENING_CONFIG = {
      start: OPENING_START_CONFIG,

      end: OPENING_END_CONFIG,

      duration: OPENING_DURATION,
    };

    window.ChimaeraAtmosphere.HERO_CONFIG = HERO_CONFIG;
  }

  // ============================================================
  // BOOTSTRAP
  // ============================================================

  if (document.querySelector("[data-include]")) {
    document.addEventListener("chimaera:includes-loaded", init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
