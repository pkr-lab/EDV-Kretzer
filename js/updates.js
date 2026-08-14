/* =========================================================
   EDV-Kretzer – Updates-Seite: Changelog laden & rendern,
   Live-Status-Embed absichern.
   Nur auf updates.html eingebunden.
   ========================================================= */

(function () {
  "use strict";

  var list = document.getElementById("updates-list");
  var meta = document.getElementById("updates-meta");

  if (list) {
    fetch("data/updates.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (updates) {
        renderUpdates(updates || []);
      })
      .catch(function () {
        meta.textContent = "Updates konnten nicht geladen werden.";
        list.innerHTML = '<div class="empty-state">Liste ist gerade nicht erreichbar – versuch es später nochmal.</div>';
      });
  }

  function renderUpdates(updates) {
    var sorted = updates.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });

    if (sorted.length === 0) {
      meta.textContent = "Noch keine Einträge.";
      list.innerHTML = '<div class="empty-state">Hier steht bald das Erste – schau später nochmal vorbei.</div>';
      return;
    }

    meta.textContent = sorted.length + (sorted.length === 1 ? " Update" : " Updates");

    list.innerHTML = sorted
      .map(function (u, i) {
        var dateLabel = formatDate(u.date);
        return (
          '<article class="update-card glass-card reveal" style="--i:' + (i % 8) + '">' +
          '<div class="update-meta">' +
          '<time datetime="' + u.date + '">' + dateLabel + "</time>" +
          (u.tag ? '<span class="update-tag">' + u.tag + "</span>" : "") +
          "</div>" +
          "<h3>" + u.title + "</h3>" +
          "<p>" + u.body + "</p>" +
          "</article>"
        );
      })
      .join("");

    list.querySelectorAll(".reveal").forEach(function (el) {
      requestAnimationFrame(function () { el.classList.add("visible"); });
    });
  }

  function formatDate(iso) {
    var parts = (iso || "").split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
  }

  /* ---------- Status-Embed: stiller Fallback, falls das iframe blockiert wird ---------- */
  var iframe = document.getElementById("status-iframe");
  var fallback = document.getElementById("status-fallback");
  if (iframe && fallback) {
    var loaded = false;
    iframe.addEventListener("load", function () { loaded = true; });
    setTimeout(function () {
      if (!loaded) fallback.classList.add("visible");
    }, 4000);
  }
})();
