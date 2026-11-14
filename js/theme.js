/* =========================================================
   EDV-Kretzer – Farbschema (hell/dunkel)
   Wird synchron im <head> geladen, damit data-theme vor dem ersten Zeichnen steht.
   Ohne gespeicherte Wahl entscheidet prefers-color-scheme (rein per CSS).
   Der Umschalter (.theme-toggle) steht fest im HTML; sein Symbol wählt das CSS.
   ========================================================= */

(function () {
  "use strict";

  var KEY = "edvkretzer_theme";
  var root = document.documentElement;
  var query = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var COLORS = { light: "#ffffff", dark: "#17100c" };

  function readChoice() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "dark" || value === "light" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function current() {
    return root.getAttribute("data-theme") || (query && query.matches ? "dark" : "light");
  }

  // Adressleisten-Farbe auf Mobilgeräten: bei Wahl des Nutzers beide theme-color-Tags angleichen
  function syncMeta() {
    var color = COLORS[current()];
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
      meta.setAttribute("content", color);
    });
  }

  var saved = readChoice();
  if (saved) {
    root.setAttribute("data-theme", saved);
    document.addEventListener("DOMContentLoaded", syncMeta);
  }

  // Delegiert, damit der Klick sofort greift (die Seite lädt am Ende ein externes Chat-Skript)
  document.addEventListener("click", function (e) {
    var button = e.target.closest ? e.target.closest(".theme-toggle") : null;
    if (!button) return;
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* ignore */ }
    syncMeta();
  });
})();
