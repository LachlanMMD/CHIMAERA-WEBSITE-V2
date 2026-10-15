/**
 * CHIMAERA — newsletter-form.js
 *
 * Sends the footer newsletter form to MailerLite without leaving the page.
 * The form's action, field names (fields[email]) and hidden inputs come from
 * the MailerLite embed for the "Footer signup" form — the same endpoint
 * MailerLite's own embed script posts to.
 *   success → "check your inbox" line (double opt-in: they must confirm)
 *   failure → line asking them to try again or email us
 * Without JS the form posts to MailerLite in a new tab.
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-newsletter-form]");
  if (!form) return;

  var status = document.querySelector("[data-newsletter-status]");
  var button = form.querySelector('button[type="submit"]');
  var input = form.querySelector('input[type="email"]');

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    button.disabled = true;
    status.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        return response.json().then(function (result) {
          if (!response.ok || !result || result.success === false) throw new Error("Not subscribed");
        });
      })
      .then(function () {
        form.reset();
        status.textContent = "Almost there — check your inbox and confirm your email.";
      })
      .catch(function (error) {
        console.error("Newsletter form:", error);
        status.textContent = "That didn't go through. Check the address and try again, or email info@chimaeracollective.dk.";
        input.focus();
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
