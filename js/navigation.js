/**
 * CHIMAERA — navigation.js
 *
 * Navigation is a transparent overlay over the persistent atmosphere.
 *
 * Opening the navigation:
 *   1. reveals the nav panel
 *   2. blurs the underlying page content
 *   3. transitions the SAME atmosphere into its calmer NAV state
 *
 * Closing reverses those states.
 *
 * There is deliberately NO second atmosphere canvas.
 */

(function () {
  "use strict";

  function setup() {
    var trigger = document.getElementById("nav-trigger");
    var panel = document.getElementById("site-nav");
    var backdrop = document.getElementById("nav-backdrop");

    if (!trigger || !panel || !backdrop) {
      return;
    }

    var isOpen = false;
    var lastFocused = null;

    function focusableElements() {
      return Array.prototype.slice.call(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    }

    // ============================================================
    // OPEN
    // ============================================================

    function openNav() {
      if (isOpen) {
        return;
      }

      isOpen = true;
      lastFocused = document.activeElement;

      /*
       * Make backdrop available before beginning the CSS transition.
       */
      backdrop.hidden = false;

      /*
       * Transition the persistent atmosphere into NAV state.
       *
       * This is the important part:
       *
       *      LANDING
       *          ↓
       *      NAV CONFIG
       *
       * No new atmosphere is created.
       */
      if (window.ChimaeraAtmosphere && window.ChimaeraAtmosphere.main && window.ChimaeraAtmosphere.main.enterNavState) {
        window.ChimaeraAtmosphere.main.enterNavState(1800);
      }

      requestAnimationFrame(function () {
        document.body.classList.add("nav-open");
        panel.classList.add("is-open");
        backdrop.classList.add("is-open");
      });

      panel.setAttribute("aria-hidden", "false");
      trigger.setAttribute("aria-expanded", "true");

      var focusables = focusableElements();

      if (focusables.length) {
        focusables[0].focus();
      }

      document.addEventListener("keydown", onKeydown);
      backdrop.addEventListener("click", closeNav);
    }

    // ============================================================
    // CLOSE
    // ============================================================

    function closeNav() {
      if (!isOpen) {
        return;
      }

      isOpen = false;

      /*
       * Reverse the atmospheric transition.
       *
       * The atmosphere returns organically to the exact landing
       * configuration rather than restarting.
       */
      if (window.ChimaeraAtmosphere && window.ChimaeraAtmosphere.main && window.ChimaeraAtmosphere.main.enterLandingState) {
        window.ChimaeraAtmosphere.main.enterLandingState(1800);
      }

      document.body.classList.remove("nav-open");
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");

      panel.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-expanded", "false");

      document.removeEventListener("keydown", onKeydown);
      backdrop.removeEventListener("click", closeNav);

      /*
       * Let the CSS closing transition finish before removing the
       * backdrop from the accessibility tree.
       */
      window.setTimeout(function () {
        if (!isOpen) {
          backdrop.hidden = true;
        }
      }, 420);

      /*
       * Return focus to whatever opened the navigation.
       */
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      } else {
        trigger.focus();
      }
    }

    // ============================================================
    // KEYBOARD
    // ============================================================

    function onKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeNav();
        return;
      }

      if (event.key === "Tab") {
        var focusables = focusableElements();

        if (!focusables.length) {
          return;
        }

        var first = focusables[0];
        var last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    // ============================================================
    // TRIGGER
    // ============================================================

    trigger.addEventListener("click", function () {
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  // ==============================================================
  // BOOTSTRAP
  // ==============================================================

  if (document.querySelector("[data-include]")) {
    document.addEventListener("chimaera:includes-loaded", setup);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
