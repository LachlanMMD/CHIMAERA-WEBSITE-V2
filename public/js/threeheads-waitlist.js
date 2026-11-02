/**
 * THREE HEADS — threeheads-waitlist.js
 *
 * Sends the /threeheads/ waitlist form to the Google Apps Script web app
 * (scripts/threeheads-waitlist.gs), which appends a row to the sheet.
 *   success → form replaced by a confirmation
 *   failure → inline error under the button (this page has its own
 *             identity, so it doesn't bounce to CHIMAERA's /error/)
 *
 * Body is form-encoded: a "simple" request, so the browser sends no CORS
 * preflight, which Apps Script can't answer.
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-th-waitlist]");
  if (!form) return;

  var status = form.querySelector("[data-th-status]");
  var button = form.querySelector('button[type="submit"]');
  var endpoint = form.getAttribute("action");

  var MESSAGES = {
    name: "Add your name.",
    phone: "Add a phone number we can text, e.g. +45 12 34 56 78.",
    consent: "Tick the box so we're allowed to text you.",
    network: "That didn't go through. Check your connection and try again, or message @threeheads.cph.",
    setup: "Sign-ups aren't open yet. Message @threeheads.cph to get on the list.",
  };

  function setStatus(text, state) {
    status.textContent = text;
    if (state) status.setAttribute("data-state", state);
    else status.removeAttribute("data-state");
  }

  // Digits, spaces, dashes, brackets, optional leading +; 8–15 digits.
  function phoneOk(value) {
    var digits = value.replace(/\D/g, "");
    return /^\+?[\d\s\-().]+$/.test(value) && digits.length >= 8 && digits.length <= 15;
  }

  function validate() {
    var name = form.elements.name;
    var phone = form.elements.phone;
    var consent = form.elements.consent;
    var problem = null;

    [name, phone].forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });

    if (!name.value.trim()) {
      problem = { field: name, text: MESSAGES.name };
    } else if (!phoneOk(phone.value.trim())) {
      problem = { field: phone, text: MESSAGES.phone };
    } else if (!consent.checked) {
      problem = { field: consent, text: MESSAGES.consent };
    }

    if (problem) {
      if (problem.field !== consent) problem.field.setAttribute("aria-invalid", "true");
      problem.field.focus();
      setStatus(problem.text, "error");
      return false;
    }
    return true;
  }

  function showDone(firstName) {
    var done = document.createElement("div");
    done.className = "th-done";
    done.setAttribute("tabindex", "-1");

    var title = document.createElement("p");
    title.className = "th-done__title";
    title.textContent = firstName ? "You're on the list, " + firstName + "." : "You're on the list.";

    var body = document.createElement("p");
    body.textContent = "You'll get a text when the next table is set.";

    done.appendChild(title);
    done.appendChild(body);
    form.replaceWith(done);
    done.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!endpoint) {
      setStatus(MESSAGES.setup, "error");
      return;
    }
    if (!validate()) return;

    var data = new URLSearchParams(new FormData(form));
    var firstName = form.elements.name.value.trim().split(/\s+/)[0];

    button.disabled = true;
    setStatus("Joining…");

    fetch(endpoint, { method: "POST", body: data })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        if (!result || !result.ok) throw new Error((result && result.error) || "Not saved");
        showDone(firstName);
      })
      .catch(function (error) {
        console.error("Waitlist:", error);
        button.disabled = false;
        setStatus(MESSAGES.network, "error");
      });
  });
})();
