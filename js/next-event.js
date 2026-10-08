/**
 * CHIMAERA — next-event.js
 *
 * Section 0.5 — Next event (variant: Line).
 *
 * The static markup in index.html is the no-JS fallback: a plain
 * "See upcoming events" link, with the real event row present but
 * [hidden]. This script fetches data/events.json, picks the soonest
 * non-past event, and fills the row in — or leaves the fallback exactly
 * as it was if the fetch fails. See docs/HOMEPAGE-SPEC.md §3 / §7.
 *
 * No atmosphere trigger here — this section doesn't move the field.
 */

(function () {
  "use strict";

  var ARROW_SVG =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  /*
   * ----------------------------------------------------------
   * DATE HELPERS
   * ----------------------------------------------------------
   *
   * Parsed as a local-midnight Date, not via `new Date(isoString)`
   * (which parses as UTC midnight and can read as "yesterday" in
   * negative-UTC-offset timezones) — so comparisons against "today"
   * are consistent.
   */

  function parseISODate(isoDate) {
    if (!isoDate) return null;

    var parts = isoDate.split("-");
    if (parts.length !== 3) return null;

    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);

    var date = new Date(year, month, day);

    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(isoDate) {
    var date = parseISODate(isoDate);
    if (!date) return isoDate;

    var day = String(date.getDate()).padStart(2, "0");
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var year = date.getFullYear();

    return day + "." + month + "." + year;
  }

  /*
   * ----------------------------------------------------------
   * PICK THE NEXT EVENT
   * ----------------------------------------------------------
   *
   * Non-past, date >= today, soonest first.
   */

  function pickNextEvent(events) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = (events || []).filter(function (event) {
      if (!event || event.status === "past") return false;

      var eventDate = parseISODate(event.date);
      return eventDate !== null && eventDate >= today;
    });

    upcoming.sort(function (a, b) {
      return parseISODate(a.date) - parseISODate(b.date);
    });

    return upcoming[0] || null;
  }

  /*
   * ----------------------------------------------------------
   * RENDER
   * ----------------------------------------------------------
   */

  function renderSoldOut(actionEl) {
    var tag = document.createElement("span");
    tag.className = "stamp next-event__stamp";
    tag.textContent = "Sold out";

    var waitlist = document.createElement("a");
    waitlist.className = "next-event__waitlist-link";
    waitlist.href = "#footer";
    waitlist.textContent = "Join the waitlist";

    actionEl.appendChild(tag);
    actionEl.appendChild(waitlist);
  }

  function renderTickets(actionEl, event) {
    var link = document.createElement("a");
    link.className = "next-event__ticket-link";
    link.href = event.ticketUrl || "#";
    link.setAttribute("aria-label", "Tickets for " + event.title);
    link.innerHTML = "Tickets " + ARROW_SVG;

    actionEl.appendChild(link);
  }

  function setup() {
    var section = document.querySelector(".next-event");
    if (!section) return;

    var row = section.querySelector("[data-next-event-row]");
    var fallback = section.querySelector("[data-next-event-fallback]");
    var dateEl = section.querySelector("[data-next-event-date]");
    var titleEl = section.querySelector("[data-next-event-title]");
    var venueEl = section.querySelector("[data-next-event-venue]");
    var actionEl = section.querySelector("[data-next-event-action]");

    if (!row || !fallback || !dateEl || !titleEl || !venueEl || !actionEl) return;

    fetch("/data/events.json")
      .then(function (response) {
        if (!response.ok) throw new Error("events.json request failed");
        return response.json();
      })
      .then(function (events) {
        var next = pickNextEvent(events);

        if (!next) {
          /*
           * No upcoming events at all — the whole "fast path to
           * tickets" strip has nothing to offer, so it goes away
           * rather than show an empty shell.
           */
          section.hidden = true;
          return;
        }

        dateEl.textContent = formatDate(next.date);
        titleEl.textContent = next.title;
        venueEl.textContent = next.venue;

        actionEl.innerHTML = "";

        if (next.status === "soldout") {
          renderSoldOut(actionEl);
        } else {
          renderTickets(actionEl, next);
        }

        row.hidden = false;
        fallback.hidden = true;
      })
      .catch(function () {
        /*
         * Fetch or parse failed — leave the static "See upcoming
         * events" fallback exactly as it was. Nothing to do here.
         */
      });
  }

  if (document.querySelector("[data-include]")) {
    document.addEventListener("chimaera:includes-loaded", setup, { once: true });
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
