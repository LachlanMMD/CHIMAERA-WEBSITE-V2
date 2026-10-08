/**
 * CHIMAERA — archive.js
 *
 * Archive page (/archive/):
 *  - Desktop arrow buttons scroll each evening's strip.
 *  - Lightbox: tapping a photo or clip opens a full-screen <dialog> that
 *    steps through that evening only. Clips play only here (muted, looped),
 *    never in the strip. Keyboard: ← → Esc. Touch: swipe left/right.
 *
 * Markup comes from src/pages/archive.astro:
 *   [data-lightbox-group]  one evening (section, has an <h2>)
 *   [data-lightbox-item]   button with data-type="photo|video", data-src, data-poster
 */
(function () {
  "use strict";

  function setup() {
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox-group]"));
    if (!groups.length) return;

    // ------------------------------------------------------------------
    // STRIP ARROWS
    // ------------------------------------------------------------------

    groups.forEach(function (group) {
      var strip = group.querySelector("[data-strip]");

      Array.prototype.forEach.call(group.querySelectorAll("[data-scroll]"), function (button) {
        button.addEventListener("click", function () {
          var direction = Number(button.getAttribute("data-scroll"));
          strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: "smooth" });
        });
      });
    });

    // ------------------------------------------------------------------
    // LIGHTBOX
    // ------------------------------------------------------------------

    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Photo viewer");
    dialog.innerHTML =
      '<div class="lightbox__top">' +
      '<p class="lightbox__title"></p>' +
      '<button type="button" class="lightbox__btn lightbox__btn--close" aria-label="Close">✕</button>' +
      "</div>" +
      '<div class="lightbox__stage"></div>' +
      '<div class="lightbox__bottom">' +
      '<button type="button" class="lightbox__btn" data-step="-1" aria-label="Previous">←</button>' +
      '<span class="lightbox__count" aria-live="polite"></span>' +
      '<button type="button" class="lightbox__btn" data-step="1" aria-label="Next">→</button>' +
      "</div>";
    document.body.appendChild(dialog);

    var titleEl = dialog.querySelector(".lightbox__title");
    var stage = dialog.querySelector(".lightbox__stage");
    var countEl = dialog.querySelector(".lightbox__count");

    var items = [];
    var index = 0;
    var opener = null;

    function render() {
      var item = items[index];
      stage.innerHTML = "";

      if (item.getAttribute("data-type") === "video") {
        var video = document.createElement("video");
        video.src = item.getAttribute("data-src");
        if (item.getAttribute("data-poster")) video.poster = item.getAttribute("data-poster");
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        stage.appendChild(video);
      } else {
        var img = document.createElement("img");
        img.src = item.getAttribute("data-src");
        img.alt = "";
        stage.appendChild(img);
      }

      countEl.textContent = index + 1 + " / " + items.length;
    }

    function step(delta) {
      if (items.length < 2) return;
      index = (index + delta + items.length) % items.length;
      render();
    }

    function open(group, item) {
      items = Array.prototype.slice.call(group.querySelectorAll("[data-lightbox-item]"));
      index = Math.max(0, items.indexOf(item));
      opener = item;

      var heading = group.querySelector("h2");
      titleEl.textContent = heading ? heading.textContent : "";

      render();
      document.documentElement.classList.add("lightbox-open");
      dialog.showModal();
    }

    dialog.addEventListener("close", function () {
      stage.innerHTML = ""; // stops any playing clip
      document.documentElement.classList.remove("lightbox-open");
      if (opener) opener.focus();
    });

    dialog.querySelector(".lightbox__btn--close").addEventListener("click", function () {
      dialog.close();
    });

    Array.prototype.forEach.call(dialog.querySelectorAll("[data-step]"), function (button) {
      button.addEventListener("click", function () {
        step(Number(button.getAttribute("data-step")));
      });
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    });

    // Swipe: horizontal drag over the stage.
    var startX = null;
    stage.addEventListener("pointerdown", function (event) {
      startX = event.clientX;
    });
    stage.addEventListener("pointerup", function (event) {
      if (startX === null) return;
      var dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });

    groups.forEach(function (group) {
      Array.prototype.forEach.call(group.querySelectorAll("[data-lightbox-item]"), function (item) {
        item.addEventListener("click", function () {
          open(group, item);
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
