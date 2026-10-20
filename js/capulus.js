(function () {
  "use strict";

  var grid = document.getElementById("project-grid");
  var releaseList = document.getElementById("capulus-releases");
  if (!grid && !releaseList) return;

  var escapeHtml = function (value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  var formatDate = function (iso) {
    var date = new Date(iso + "T00:00:00");
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  };

  var load = function (url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  };

  var reveal = function (container) {
    container.querySelectorAll(".reveal").forEach(function (el) {
      requestAnimationFrame(function () { el.classList.add("visible"); });
    });
  };

  if (grid) {
    Promise.all([load("data/projects.json"), load("data/versions.json").catch(function () { return {}; })])
      .then(function (results) {
        var projects = results[0];
        var versions = results[1];
        grid.innerHTML = projects
          .map(function (project, i) {
            var version = versions[project.repo];
            var repoUrl = "https://github.com/pkr-lab/" + encodeURIComponent(project.repo);
            return (
              '<article class="project-card glass-card reveal" style="--i:' + (i % 8) + '">' +
              '<div class="project-top"><h3>' + escapeHtml(project.name) + "</h3>" +
              (version
                ? '<a class="version-badge" href="' + escapeHtml(version.url) + '" target="_blank" rel="noopener" title="Veröffentlicht am ' + escapeHtml(formatDate(version.date)) + '">' + escapeHtml(version.tag) + "</a>"
                : "") +
              "</div>" +
              "<p>" + escapeHtml(project.summary) + "</p>" +
              '<div class="project-tags">' +
              (project.stack || []).map(function (item) { return '<span class="tag">' + escapeHtml(item) + "</span>"; }).join("") +
              "</div>" +
              '<div class="project-links"><a href="' + repoUrl + '" target="_blank" rel="noopener">GitHub</a>' +
              (project.docs ? '<a href="' + escapeHtml(project.docs) + '" target="_blank" rel="noopener">Dokumentation</a>' : "") +
              "</div></article>"
            );
          })
          .join("");
        reveal(grid);
      })
      .catch(function () {
        grid.innerHTML = '<p class="status-loading">Projekte gerade nicht abrufbar.</p>';
      });
  }

  if (releaseList) {
    load("data/releases.json")
      .then(function (releases) {
        releaseList.innerHTML = releases
          .slice(0, 5)
          .map(function (release, i) {
            return (
              '<article class="update-card glass-card reveal" style="--i:' + i + '">' +
              '<div class="update-meta"><time datetime="' + escapeHtml(release.date) + '">' + escapeHtml(formatDate(release.date)) + "</time>" +
              '<span class="update-tag">' + escapeHtml(release.tag) + "</span></div>" +
              "<h3>" + release.title + "</h3><p>" + release.body + "</p></article>"
            );
          })
          .join("");
        reveal(releaseList);
      })
      .catch(function () {
        releaseList.innerHTML = '<div class="empty-state">Releases gerade nicht abrufbar.</div>';
      });
  }
})();
