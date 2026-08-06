/* =========================================================
   EDV-Kretzer – App-Katalog: Laden, Filtern, Suchen, Rendern
   Nur auf anwendungen.html eingebunden.
   ========================================================= */

(function () {
  "use strict";

  var grid = document.getElementById("app-grid");
  var searchInput = document.getElementById("app-search");
  var filterRow = document.getElementById("filter-row");
  var resultsMeta = document.getElementById("results-meta");

  if (!grid) return;

  var CATEGORIES = ["Alle", "Infrastruktur", "Sicherheit & Identity", "Monitoring", "Automatisierung", "Medien & Storage", "Produktivität", "Kommunikation"];
  var activeCategory = "Alle";
  var apps = [];

  function iconMarkup(icon) {
    return '<span aria-hidden="true">' + icon + "</span>";
  }

  function renderFilters() {
    filterRow.innerHTML = CATEGORIES.map(function (cat) {
      var active = cat === activeCategory ? " active" : "";
      return (
        '<button type="button" class="filter-chip' +
        active +
        '" data-cat="' +
        cat +
        '" aria-pressed="' +
        (cat === activeCategory) +
        '">' +
        cat +
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

    grid.innerHTML = filtered
      .map(function (app) {
        return (
          '<article class="app-card glass-card reveal">' +
          '<div class="app-top">' +
          '<div class="app-icon">' + iconMarkup(app.icon) + "</div>" +
          "<div>" +
          "<h3>" + app.name + "</h3>" +
          '<span class="cat">' + app.categories.join(" · ") + "</span>" +
          "</div>" +
          "</div>" +
          "<p>" + app.description + "</p>" +
          '<div class="tag-row">' +
          app.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("") +
          "</div>" +
          '<div class="app-footer">' +
          '<a class="btn btn-primary btn-sm" href="' + app.url + '" target="_blank" rel="noopener">Projekt-Website</a>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    // Neu gerenderte Karten sofort sichtbar machen (bereits im Sichtbereich)
    grid.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.setProperty("--i", i % 8);
      requestAnimationFrame(function () { el.classList.add("visible"); });
    });
  }

  function init(data) {
    apps = data;
    renderFilters();
    renderGrid();

    // Kategorie via URL-Parameter vorauswählen, z. B. anwendungen.html?kategorie=Monitoring
    var params = new URLSearchParams(location.search);
    var presetCat = params.get("kategorie");
    if (presetCat && CATEGORIES.indexOf(presetCat) !== -1) {
      activeCategory = presetCat;
      renderFilters();
      renderGrid();
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderGrid);
    }
  }

  fetch("data/apps.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Netzwerkfehler beim Laden des App-Katalogs");
      return res.json();
    })
    .then(init)
    .catch(function (err) {
      grid.innerHTML =
        '<div class="empty-state">App-Katalog konnte nicht geladen werden. Falls du die Seite lokal per Doppelklick geöffnet hast: bitte über einen lokalen Webserver aufrufen (z. B. <code>python3 -m http.server</code>).</div>';
      console.error(err);
    });
})();
