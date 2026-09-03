/**
 * CHIMAERA — include.js
 * Minimal HTML partial loader so header/navigation/footer stay in one
 * place (components/*.html) without a build step. Any element with
 * data-include="/components/x.html" gets that file's markup injected,
 * then a `chimaera:includes-loaded` event fires once everything is in
 * the DOM so navigation.js / atmosphere.js can safely bind to it.
 */
(function () {
  'use strict';

  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));

  if (nodes.length === 0) {
    document.dispatchEvent(new CustomEvent('chimaera:includes-loaded'));
    return;
  }

  Promise.all(
    nodes.map(function (node) {
      var url = node.getAttribute('data-include');
      return fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('Failed to load ' + url);
          return res.text();
        })
        .then(function (html) {
          node.outerHTML = html;
        })
        .catch(function (err) {
          console.error(err);
        });
    })
  ).then(function () {
    document.dispatchEvent(new CustomEvent('chimaera:includes-loaded'));
  });
})();
