/* =========================================================
   EDV-Kretzer – App-Katalog: Laden, Filtern, Suchen, Rendern
   Nur auf anwendungen.html eingebunden.
   ========================================================= */

(function () {
  "use strict";

  var EDV = window.EDV;
  var grid = document.getElementById("app-grid");
  var searchInput = document.getElementById("app-search");
  var filterRow = document.getElementById("filter-row");
  var resultsMeta = document.getElementById("results-meta");

  if (!grid) return;

  var CATEGORIES = ["Alle", "Infrastruktur", "Sicherheit & Identity", "Monitoring", "Automatisierung", "Medien & Storage", "Produktivität", "Kommunikation"];
  var activeCategory = "Alle";
  var apps = [];

  function renderFilters() {
    filterRow.innerHTML = CATEGORIES.map(function (cat) {
      var isActive = cat === activeCategory;
      var label = EDV.escapeHtml(cat);
      return (
        '<button type="button" class="filter-chip' +
        (isActive ? " active" : "") +
        '" data-cat="' +
        label +
        '" aria-pressed="' +
        isActive +
        '">' +
        label +
        "</button>"
      );
    }).join("");

    filterRow.querySelectorAll(".filter-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeCategory = btn.getAttribute("data-cat");
        renderFilters();
        renderGrid();
      });
    });
  }

  function matches(app, query) {
    var inCategory = activeCategory === "Alle" || app.categories.indexOf(activeCategory) !== -1;
    if (!inCategory) return false;
    if (!query) return true;
    var haystack = (app.name + " " + app.description + " " + app.tags.join(" ")).toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function renderGrid() {
    var query = (searchInput && searchInput.value.trim().toLowerCase()) || "";
    var filtered = apps.filter(function (app) { return matches(app, query); });

    resultsMeta.textContent =
      filtered.length === 0
        ? "Keine Anwendungen gefunden."
        : filtered.length + " von " + apps.length + " Anwendungen";

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state">Keine Treffer. Passe Suche oder Filter an oder <a href="kontakt.html">schreib mir</a>, falls ein Dienst fehlt.</div>';
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join("");
  }

  function renderCard(app) {
    var esc = EDV.escapeHtml;
    var url = EDV.safeUrl(app.url);
    return (
      '<article class="app-card glass-card">' +
      '<div class="app-top">' +
      '<div class="app-icon"><span aria-hidden="true">' + esc(app.icon) + "</span></div>" +
      "<div>" +
      "<h3>" + esc(app.name) + "</h3>" +
      '<span class="cat">' + esc(app.categories.join(" · ")) + "</span>" +
      "</div>" +
      "</div>" +
      "<p>" + esc(app.description) + "</p>" +
      '<div class="tag-row">' +
      app.tags.map(function (tag) { return '<span class="tag">' + esc(tag) + "</span>"; }).join("") +
      "</div>" +
      (url
        ? '<div class="app-footer">' +
          '<a class="btn btn-primary btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">Projekt-Website</a>' +
          "</div>"
        : "") +
      "</article>"
    );
  }

  function init(data) {
    apps = data;

    // Kategorie via URL-Parameter vorauswählen, z. B. anwendungen.html?kategorie=Monitoring
    var presetCategory = new URLSearchParams(location.search).get("kategorie");
    if (presetCategory && CATEGORIES.indexOf(presetCategory) !== -1) {
      activeCategory = presetCategory;
    }
    renderFilters();
    renderGrid();

    if (searchInput) {
      searchInput.addEventListener("input", renderGrid);
    }
  }

  EDV.fetchJson("data/apps.json")
    .then(init)
    .catch(function (err) {
      grid.innerHTML =
        '<div class="empty-state">App-Katalog konnte nicht geladen werden. Falls du die Seite lokal per Doppelklick geöffnet hast: bitte über einen lokalen Webserver aufrufen (z. B. <code>python3 -m http.server</code>).</div>';
      console.error(err);
    });
})();
