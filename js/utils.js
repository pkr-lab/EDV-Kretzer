(function () {
  "use strict";

  var DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeUrl(value, prefix) {
    var url = String(value == null ? "" : value).trim();
    return url.indexOf(prefix || "https://") === 0 ? url : "";
  }

  function formatDate(iso) {
    var text = String(iso == null ? "" : iso);
    var parts = DATE_PATTERN.exec(text);
    if (!parts) return text;
    var year = +parts[1];
    var month = +parts[2] - 1;
    var day = +parts[3];
    var date = new Date(Date.UTC(year, month, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return text;
    return date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " bei " + url);
      return res.json();
    });
  }

  window.EDV = {
    escapeHtml: escapeHtml,
    safeUrl: safeUrl,
    formatDate: formatDate,
    fetchJson: fetchJson
  };
})();
