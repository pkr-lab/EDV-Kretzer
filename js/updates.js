/* =========================================================
   EDV-Kretzer – Updates-Seite: Changelog laden & rendern,
   Live-Status als reine Datenanzeige (kein Link/iframe auf den
   echten Dienst).
   Nur auf updates.html eingebunden.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Changelog ---------- */
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

  /* ---------- Live-Status: nur Daten, kein Link/iframe zum Dienst selbst ----------
     Die Basis-URL steht hier verschleiert (Base64) statt als Klartext-String,
     damit sie nicht per "Seitenquelltext ansehen" oder Ctrl+F auffindbar ist.
     Das ist KEINE echte Verschlüsselung: der Browser muss die Ziel-URL beim
     eigentlichen Request ohnehin offenlegen, im Netzwerk-Tab der Entwickler-
     tools ist sie sichtbar. Es verhindert nur den beiläufigen Fund/Klick,
     nicht den gezielten. Echter Schutz kommt vom Login auf dem
     Monitoring-Dashboard selbst, nicht von dieser Verschleierung. */
  var STATUS_BASE = atob("aHR0cHM6Ly9zdGF0dXMtcHJvZC5wa2UtbGFiLmRl");
  var STATUS_SLUG = "homelab"; // an die tatsächliche Status-Page in Kuma anpassen

  var statusWidget = document.getElementById("status-widget");
  if (statusWidget) {
    Promise.all([
      fetch(STATUS_BASE + "/api/status-page/" + STATUS_SLUG).then(function (r) { return r.json(); }),
      fetch(STATUS_BASE + "/api/status-page/heartbeat/" + STATUS_SLUG).then(function (r) { return r.json(); }),
    ])
      .then(function (results) {
        renderStatus(results[0], results[1]);
      })
      .catch(function () {
        statusWidget.innerHTML = '<p class="status-loading">Status gerade nicht abrufbar.</p>';
      });
  }

  function renderStatus(page, heartbeat) {
    var groups = (page && page.publicGroupList) || [];
    var uptimeList = (heartbeat && heartbeat.uptimeList) || {};
    var heartbeatList = (heartbeat && heartbeat.heartbeatList) || {};

    var monitors = [];
    groups.forEach(function (g) {
      (g.monitorList || []).forEach(function (m) { monitors.push(m); });
    });

    if (monitors.length === 0) {
      statusWidget.innerHTML = '<p class="status-loading">Noch keine öffentliche Status-Page konfiguriert.</p>';
      return;
    }

    var downCount = 0;
    var rows = monitors.map(function (m) {
      var beats = heartbeatList[m.id] || [];
      var last = beats[beats.length - 1];
      var statusCode = last ? last.status : null; // 0=down, 1=up, 2=pending, 3=maintenance

      var stateClass = "unknown";
      var stateLabel = "Unbekannt";
      if (statusCode === 1) { stateClass = "up"; stateLabel = "Online"; }
      else if (statusCode === 0) { stateClass = "down"; stateLabel = "Down"; downCount++; }
      else if (statusCode === 2) { stateClass = "pending"; stateLabel = "Prüfung läuft"; }
      else if (statusCode === 3) { stateClass = "maintenance"; stateLabel = "Wartung"; }

      var uptime = uptimeList[m.id + "_24"];
      var uptimeLabel = typeof uptime === "number" ? (uptime * 100).toFixed(1) + "% · 24h" : "";

      return (
        '<div class="status-row">' +
        '<span class="status-dot ' + stateClass + '" aria-hidden="true"></span>' +
        '<span class="status-row-name">' + escapeHtml(m.name || "Dienst") + "</span>" +
        '<span class="status-row-state">' + stateLabel + "</span>" +
        (uptimeLabel ? '<span class="status-row-meta">' + uptimeLabel + "</span>" : "") +
        "</div>"
      );
    });

    var summary = downCount === 0
      ? '<p class="status-overall ok"><span class="status-dot up" aria-hidden="true"></span>Alle ' + monitors.length + ' Dienste erreichbar</p>'
      : '<p class="status-overall down"><span class="status-dot down" aria-hidden="true"></span>' + downCount + " von " + monitors.length + " Diensten aktuell nicht erreichbar</p>";

    statusWidget.innerHTML = summary + rows.join("");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
