/**
 * CHIMAERA — page-chrome.js
 *
 * Secondary pages (about, contact, ...) have no opening sequence — there's
 * no intro video or homepage.js to drive the persistent chrome out of its
 * "opening" starting state. Two things normally only happen at the end of
 * homepage.js's opening sequence, and both need to happen here instead,
 * using the same public APIs homepage.js itself uses (nothing here reaches
 * into atmosphere.js or navigation.css internals):
 *
 *   - the atmosphere: mounted with opening:true, so without this it would
 *     sit frozen at the barely-visible 0.00 start point forever.
 *   - the header: starts at opacity 0 until .header--revealing is added
 *     (see css/navigation.css); homepage.js is the only thing that ever
 *     adds it.
 */
(function () {
  "use strict";

  function boot() {
    var atmosphere = window.ChimaeraAtmosphere && window.ChimaeraAtmosphere.main;

    if (!atmosphere || !atmosphere.finishOpeningState) {
      window.setTimeout(boot, 50);
      return;
    }

    var header = document.querySelector(".site-header");

    if (header) {
      header.classList.add("header--revealing");
    }

    try {
      atmosphere.finishOpeningState();
    } catch (error) {
      console.error("Atmosphere: finishOpeningState failed", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
