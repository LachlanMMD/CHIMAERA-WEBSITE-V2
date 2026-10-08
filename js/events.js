/**
 * CHIMAERA — events.js
 *
 * Section 05 — "join us" (events). Fetches data/events.json
 * independently of js/next-event.js (no shared module — see
 * docs/HOMEPAGE-SPEC.md §5; the file is tiny and every other script
 * in this codebase is already a self-contained IIFE, so a shared
 * fetch layer would be the first cross-script coupling for a saving
 * that doesn't matter at this data size).
 *
 * Renders two independent lists into #events:
 *   - upcoming (status upcoming|soldout, date >= today, ascending)
 *     into [data-events-grid], or a single empty-state line if there
 *     are none.
 *   - past (status past, newest first) into [data-events-past],
 *     hidden entirely if there are none.
 *
 * No atmosphere trigger here — this section doesn't move the field.
 */

(function () {
  "use strict";

  /*
   * ----------------------------------------------------------
   * DATE HELPERS
   * ----------------------------------------------------------
   *
   * Same local-midnight parsing and DD.MM.YYYY formatting as
   * js/next-event.js — duplicated rather than shared, see the file
   * header above.
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
   * FILTER / SORT
   * ----------------------------------------------------------
   */

  function upcomingEvents(events) {
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

    return upcoming;
  }

  function pastEvents(events) {
    var past = (events || []).filter(function (event) {
      return event && event.status === "past";
    });

    past.sort(function (a, b) {
      return parseISODate(b.date) - parseISODate(a.date);
    });

    return past;
  }

  /*
   * ----------------------------------------------------------
   * BUILD — UPCOMING CARD
   * ----------------------------------------------------------
   */

  function buildPoster(posterUrl, placeholderClass) {
    if (posterUrl) {
      var img = document.createElement("img");
      img.src = posterUrl;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      return img;
    }

    var placeholder = document.createElement("div");
    placeholder.className = placeholderClass;
    placeholder.setAttribute("aria-hidden", "true");
    return placeholder;
  }

  function buildEventCard(event) {
    var article = document.createElement("article");
    article.className = "event-card";

    var posterFig = document.createElement("figure");
    posterFig.className = "event-card__poster";
    posterFig.appendChild(buildPoster(event.poster, "event-card__poster-placeholder"));

    if (event.status === "soldout") {
      var tag = document.createElement("span");
      tag.className = "event-card__soldout-tag";
      tag.textContent = "Sold out";
      posterFig.appendChild(tag);
    }

    article.appendChild(posterFig);

    var dateEl = document.createElement("p");
    dateEl.className = "event-card__date";
    var time = document.createElement("time");
    time.dateTime = event.date;
    time.textContent = formatDate(event.date);
    dateEl.appendChild(time);
    article.appendChild(dateEl);

    var titleEl = document.createElement("p");
    titleEl.className = "event-card__title";
    titleEl.textContent = event.title;
    article.appendChild(titleEl);

    var venueEl = document.createElement("p");
    venueEl.className = "event-card__venue";
    venueEl.textContent = event.venue;
    article.appendChild(venueEl);

    var rule = document.createElement("hr");
    rule.className = "event-card__rule";
    article.appendChild(rule);

    if (event.status === "soldout") {
      var waitlist = document.createElement("a");
      waitlist.className = "event-card__waitlist-link";
      waitlist.href = "#footer";
      waitlist.textContent = "Join the waitlist";
      article.appendChild(waitlist);
    } else {
      var ticket = document.createElement("a");
      ticket.className = "event-card__ticket-link";
      ticket.href = event.ticketUrl || "#";
      ticket.setAttribute("aria-label", "Tickets for " + event.title);
      ticket.textContent = "Tickets";
      article.appendChild(ticket);
    }

    return article;
  }

  /*
   * ----------------------------------------------------------
   * BUILD — PAST POSTER
   * ----------------------------------------------------------
   */

  function buildPastPoster(event) {
    var figure = document.createElement("figure");
    figure.className = "past-poster";
    figure.appendChild(buildPoster(event.poster, "past-poster__placeholder"));

    if (event.soldOut) {
      var stamp = document.createElement("span");
      stamp.className = "past-poster__stamp";
      stamp.textContent = "Sold out";
      figure.appendChild(stamp);
    }

    var time = document.createElement("time");
    time.className = "past-poster__date";
    time.dateTime = event.date;
    time.textContent = formatDate(event.date);
    figure.appendChild(time);

    return figure;
  }

  /*
   * ----------------------------------------------------------
   * SETUP
   * ----------------------------------------------------------
   */

  function setup() {
    var section = document.getElementById("events");
    if (!section) return;

    var grid = section.querySelector("[data-events-grid]");
    var emptyState = section.querySelector("[data-events-empty]");
    var pastWrapper = section.querySelector(".homepage-events__past");
    var pastStrip = section.querySelector("[data-events-past]");

    if (!grid || !emptyState || !pastWrapper || !pastStrip) return;

    fetch("/data/events.json")
      .then(function (response) {
        if (!response.ok) throw new Error("events.json request failed");
        return response.json();
      })
      .then(function (events) {
        var upcoming = upcomingEvents(events);
        var past = pastEvents(events);

        if (upcoming.length === 0) {
          /*
           * emptyState is visible by default in the markup — nothing
           * to do here beyond leaving it that way. The grid's
           * min-height (CSS) exists to reserve space for cards while
           * the fetch is in flight; once we know there's nothing to
           * show, collapse it so the empty state doesn't sit under a
           * large blank gap.
           */
          grid.style.minHeight = "0";
        } else {
          upcoming.forEach(function (event) {
            grid.appendChild(buildEventCard(event));
          });
          emptyState.hidden = true;
        }

        if (past.length > 0) {
          past.forEach(function (event) {
            pastStrip.appendChild(buildPastPoster(event));
          });
          pastWrapper.hidden = false;
        }
      })
      .catch(function () {
        /*
         * Fetch or parse failed — emptyState's static "New events
         * soon" message stays visible exactly as it was. Same
         * collapse as the confirmed-empty case above, so it doesn't
         * sit under a large reserved blank gap.
         */
        grid.style.minHeight = "0";
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
