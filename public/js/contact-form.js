/**
 * CHIMAERA — contact-form.js
 *
 * Sends the contact form to Web3Forms without leaving the page.
 *   success → thank-you line under the button, form cleared
 *   failure → /error/ (network down, bad access key, Web3Forms refusing)
 * Without JS the form still posts to Web3Forms and shows their own
 * confirmation page.
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-contact-form]");
  if (!form) return;

  var status = form.querySelector("[data-contact-status]");
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var data = Object.fromEntries(new FormData(form));

    button.disabled = true;
    status.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        if (!result || !result.success) throw new Error((result && result.message) || "Not sent");

        form.reset();
        status.textContent = "Thank you — we'll get back to you soon.";
        button.disabled = false;
      })
      .catch(function (error) {
        console.error("Contact form:", error);
        window.location.href = "/error/";
      });
  });
})();
