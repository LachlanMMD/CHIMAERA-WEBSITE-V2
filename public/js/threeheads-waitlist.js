/**
 * Three Heads — threeheads-waitlist.js  (page: src/pages/threeheads.astro)
 *
 * Posts the waitlist form to a Google Apps Script web app (URL = the form's
 * action, set from APPS_SCRIPT_URL in the page). Apps Script doesn't send
 * CORS headers for this pattern, so the request goes out with mode
 * "no-cors": the response is opaque and can't be read. A resolved fetch is
 * treated as success; only a network failure counts as an error.
 *   success → form replaced by the thank-you line
 *   failure → inline error, button re-enabled
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-threeheads-form]");
  if (!form) return;

  var status = form.querySelector("[data-threeheads-status]");
  var thanks = document.querySelector("[data-threeheads-thanks]");
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // novalidate on the form keeps the browser quiet until submit; check here.
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (form.action.indexOf("PASTE_APPS_SCRIPT_URL") !== -1) {
      status.textContent = "Not connected yet. Try again soon.";
      return;
    }

    button.disabled = true;
    status.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(new FormData(form)),
    })
      .then(function () {
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
      })
      .catch(function (error) {
        console.error("Three Heads waitlist:", error);
        status.textContent = "That didn't go through. Check your connection and try again.";
        button.disabled = false;
      });
  });
})();
