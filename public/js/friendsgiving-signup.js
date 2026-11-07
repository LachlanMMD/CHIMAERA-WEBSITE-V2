/**
 * Friendsgiving Nº 03 — friendsgiving-signup.js
 * (page: src/pages/threeheads/friendsgiving.astro)
 *
 * Unlike threeheads-waitlist.js this one READS the Apps Script response
 * (no "no-cors"), because the page has to know the outcome: confirmed vs
 * waitlist vs duplicate vs closed. GET and a URL-encoded POST are "simple"
 * requests, and Apps Script's ContentService reply is readable cross-origin,
 * so no preflight is needed. Test step in docs/FRIENDSGIVING-SIGNUP.md.
 *
 *   load   → GET  → spots left / full (waitlist) / closed
 *   submit → POST → { status: confirmed | waitlist | duplicate | closed | … }
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-fg-form]");
  if (!form) return;

  var url = form.action;
  var price = Number(form.dataset.price) || 100;
  var spots = document.querySelector("[data-fg-spots]");
  var heading = document.querySelector("[data-fg-heading]");
  var status = form.querySelector("[data-fg-status]");
  var button = form.querySelector("[data-fg-button]");
  var priceOut = form.querySelector("[data-fg-price]");
  var plusToggle = form.querySelector("[data-fg-plus-toggle]");
  var plusFields = form.querySelector("[data-fg-plus]");
  var plusRequired = form.querySelectorAll("[data-fg-plus-required]");
  var done = document.querySelector("[data-fg-done]");
  var connected = url.indexOf("PASTE_APPS_SCRIPT_URL") === -1;

  // +1 fields: show/hide, make their name required only when shown, update price
  plusToggle.addEventListener("change", function () {
    var on = plusToggle.checked;
    plusFields.hidden = !on;
    plusRequired.forEach(function (input) { input.required = on; });
    priceOut.textContent = price * (on ? 2 : 1);
  });

  function setState(state) {
    if (state.closed) {
      spots.textContent = "Signups are closed.";
      form.hidden = true;
    } else if (state.left <= 0) {
      heading.textContent = "Join the waitlist";
      spots.textContent = "We're full. Leave your details and we'll text if a seat opens.";
      button.textContent = "Put me on the waitlist";
    } else {
      spots.textContent = state.left + (state.left === 1 ? " spot" : " spots") + " left · signups close 01.12.";
    }
  }

  if (connected) {
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(setState)
      .catch(function () { /* keep the default line; submit still works */ });
  }

  function showDone(kind, amount) {
    form.hidden = true;
    heading.hidden = true;
    spots.hidden = true;
    var block = done.querySelector("[data-fg-done-" + kind + "]");
    var amountOut = done.querySelector("[data-fg-amount]");
    if (amountOut && amount) amountOut.textContent = amount;
    block.hidden = false;
    done.hidden = false;
    done.focus();
  }

  var MESSAGES = {
    duplicate: "That phone or email is already signed up. Check your inbox.",
    closed: "Signups closed on 01.12. Text us if you still want in.",
    "missing fields": "Fill in the required fields, please.",
    "bad phone": "That phone number looks off. Use the country code, e.g. +45.",
    "bad email": "That email looks off.",
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!connected) {
      status.textContent = "Not connected yet. Try again soon.";
      return;
    }

    button.disabled = true;
    status.textContent = "Sending…";

    fetch(url, { method: "POST", body: new URLSearchParams(new FormData(form)) })
      .then(function (res) { return res.json(); })
      .then(function (out) {
        if (out.status === "confirmed" || out.status === "waitlist") {
          showDone(out.status, out.amount);
          return;
        }
        if (out.status === "closed") setState({ closed: true });
        status.textContent = MESSAGES[out.status] || "Something went wrong. Try again?";
        button.disabled = false;
      })
      .catch(function (error) {
        console.error("Friendsgiving signup:", error);
        status.textContent = "That didn't go through. Check your connection and try again.";
        button.disabled = false;
      });
  });
})();
