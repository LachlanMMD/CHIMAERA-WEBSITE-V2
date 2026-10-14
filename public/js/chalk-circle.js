/**
 * CHIMAERA — chalk-circle.js
 *
 * Draws a hand-drawn chalk circle around [data-chalk-target="footer"]
 * (the newsletter box in the footer) when someone follows a #footer link —
 * "join the newsletter", "Join the waitlist", "Hear about the next one first".
 * Loaded on every page (Base.astro), since every page has the footer.
 *
 *   - Shape: a squarish loop (superellipse) around the box, slightly tilted,
 *     wobbling and over-shooting its start like a real hand-drawn circle.
 *     It's random every time.
 *   - Chalk: an SVG filter roughens the edge and breaks the line up with grain,
 *     plus a fainter second pass slightly offset: a pencil-like double line.
 *   - Draw: the stroke is revealed along its length (stroke-dashoffset),
 *     slow-fast-slow like a hand. Respects prefers-reduced-motion.
 *
 * Colour, width and speed: --chalk-color, --chalk-width, --chalk-duration
 * in css/tokens.css. Styles in css/footer.css (CHALK CIRCLE).
 */
(function () {
  "use strict";

  var SVG = "http://www.w3.org/2000/svg";
  var target = document.querySelector("[data-chalk-target]");
  if (!target) return;

  var hash = "#" + target.getAttribute("data-chalk-target");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null;
  var pending = null;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function token(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  /**
   * Points of a wobbly, over-shooting superellipse around a w×h box.
   * room = free space beside the box before the screen edge; on phones the
   * loop is pulled in to fit and may graze the box's corners.
   */
  function loopPoints(w, h, room) {
    // a superellipse (n≈4.5) clears a rectangle's corners at ~8.5% padding
    var padX = Math.max(6, Math.min(w * 0.085, 48, room - 6));
    var padY = Math.max(14, Math.min(h * 0.085, 40));
    var rx = w / 2 + padX;
    var ry = h / 2 + padY;
    var cx = w / 2 + rand(-3, 3);
    var cy = h / 2 + rand(-3, 3);
    var tilt = rand(-0.025, 0.025);
    var start = rand(-2.6, -2.0); // upper left, where a right hand starts
    var sweep = Math.PI * 2 + rand(0.25, 0.5); // overshoot past the start
    var exponent = 2 / 4.5; // squarish enough to hug a rectangle
    var phaseA = rand(0, 6.28);
    var phaseB = rand(0, 6.28);
    var steps = 140;
    var points = [];

    for (var i = 0; i <= steps; i++) {
      var p = i / steps;
      var a = start + sweep * p;
      var cos = Math.cos(a);
      var sin = Math.sin(a);

      // starts a touch wide, ends a touch tight, so the overlap doesn't coincide
      var scale = 1 + 0.035 * (1 - p) - 0.02 * p + 0.012 * Math.sin(a * 2 + phaseA) + 0.008 * Math.sin(a * 3 + phaseB);

      var x = rx * scale * Math.sign(cos) * Math.pow(Math.abs(cos), exponent);
      var y = ry * scale * Math.sign(sin) * Math.pow(Math.abs(sin), exponent);

      points.push([
        cx + x * Math.cos(tilt) - y * Math.sin(tilt),
        cy + x * Math.sin(tilt) + y * Math.cos(tilt),
      ]);
    }

    return points;
  }

  /** Smooth path through points (Catmull-Rom → cubic Bézier). */
  function pathData(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);

    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;

      d +=
        " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
        " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
        " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }

    return d;
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  /** Grainy, rough-edged chalk: displace the edge, then punch speckled gaps. */
  function chalkFilter(id, w, h) {
    var m = 80;
    var filter = el("filter", {
      id: id,
      filterUnits: "userSpaceOnUse",
      x: -m, y: -m, width: w + m * 2, height: h + m * 2,
    });

    filter.appendChild(el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.8", numOctaves: "2", seed: Math.round(rand(1, 999)), result: "edge" }));
    filter.appendChild(el("feDisplacementMap", { in: "SourceGraphic", in2: "edge", scale: "3.5", xChannelSelector: "R", yChannelSelector: "G", result: "rough" }));
    filter.appendChild(el("feTurbulence", { type: "fractalNoise", baseFrequency: "1.4", numOctaves: "1", seed: Math.round(rand(1, 999)), result: "grain" }));
    filter.appendChild(el("feColorMatrix", { in: "grain", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.1", result: "speckle" }));
    filter.appendChild(el("feComposite", { in: "rough", in2: "speckle", operator: "in" }));

    return filter;
  }

  function draw() {
    if (current) current.remove();

    var w = target.offsetWidth;
    var h = target.offsetHeight;
    var id = "chalk-" + Math.round(rand(1e5, 1e6));
    var box = target.getBoundingClientRect();
    var room = Math.min(box.left, document.documentElement.clientWidth - box.right);
    var d = pathData(loopPoints(w, h, room));

    var svg = el("svg", { class: "chalk-circle", width: w, height: h, viewBox: "0 0 " + w + " " + h, "aria-hidden": "true", focusable: "false" });
    var defs = el("defs", {});
    defs.appendChild(chalkFilter(id, w, h));
    svg.appendChild(defs);

    var group = el("g", { filter: "url(#" + id + ")" });
    var main = el("path", { d: d });
    // Second, fainter pass slightly off the first: the pencil/chalk double line.
    var echo = el("path", { d: d, transform: "translate(" + rand(-2.5, 2.5).toFixed(1) + " " + rand(1.5, 3).toFixed(1) + ")", opacity: "0.45", "stroke-width": "1.5" });
    group.appendChild(echo);
    group.appendChild(main);
    svg.appendChild(group);

    target.appendChild(svg);
    current = svg;

    if (reduceMotion || !main.animate) return;

    var duration = parseFloat(token("--chalk-duration", "1100ms")) || 1100;
    var easing = "cubic-bezier(0.45, 0, 0.25, 1)";

    [main, echo].forEach(function (path, index) {
      var length = path.getTotalLength();
      path.style.strokeDasharray = length + " " + length;
      path.style.strokeDashoffset = length;
      path
        .animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
          duration: duration * (index ? 0.9 : 1),
          delay: index ? duration * 0.12 : 0,
          easing: easing,
          fill: "forwards",
        })
        .finished.then(function () {
          path.style.strokeDashoffset = 0;
        })
        .catch(function () {});
    });
  }

  /** Bring the box into view if needed, then draw once it's properly visible. */
  function drawWhenVisible() {
    if (pending) pending.disconnect();

    var box = target.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    if (!("IntersectionObserver" in window)) {
      window.setTimeout(draw, 300);
      return;
    }

    pending = new IntersectionObserver(
      function (entries) {
        if (!entries[0].isIntersecting) return;
        pending.disconnect();
        pending = null;
        window.setTimeout(draw, 250);
      },
      { threshold: 0.6 }
    );
    pending.observe(target);
  }

  // Arrived on a page via …#footer
  if (window.location.hash === hash) drawWhenVisible();

  // Followed a #message link while on the page
  window.addEventListener("hashchange", function () {
    if (window.location.hash === hash) drawWhenVisible();
  });

  // Clicked a #footer link when the hash is already #footer (no hashchange)
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;

    var url = new URL(link.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash === hash && window.location.hash === hash) {
      drawWhenVisible();
    }
  });

  // Keep a finished circle fitted to the box when the layout changes.
  var resizeTimer;
  window.addEventListener("resize", function () {
    if (!current) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      var wasReduced = reduceMotion;
      reduceMotion = true; // redraw in place, no replay
      draw();
      reduceMotion = wasReduced;
    }, 200);
  });
})();
