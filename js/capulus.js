(function () {
  "use strict";

  var grid = document.getElementById("project-grid");
  var releaseList = document.getElementById("capulus-releases");
  if (!grid && !releaseList) return;

  var escapeHtml = window.EDV.escapeHtml;
  var safeUrl = window.EDV.safeUrl;
  var formatDate = window.EDV.formatDate;
  var load = window.EDV.fetchJson;

  if (grid) {
    Promise.all([load("data/projects.json"), load("data/versions.json").catch(function () { return {}; })])
      .then(function (results) {
        var projects = results[0];
        var versions = results[1];
        grid.innerHTML = projects
          .map(function (project) {
            var version = versions[project.repo];
            var versionUrl = version ? safeUrl(version.url, "https://github.com/pkr-lab/") : "";
            var docsUrl = safeUrl(project.docs);
            var repoUrl = "https://github.com/pkr-lab/" + encodeURIComponent(project.repo);
            return (
              '<article class="project-card glass-card">' +
              '<div class="project-top"><h3>' + escapeHtml(project.name) + "</h3>" +
              (versionUrl
                ? '<a class="version-badge" href="' + escapeHtml(versionUrl) + '" target="_blank" rel="noopener" title="Veröffentlicht am ' + escapeHtml(formatDate(version.date)) + '">' + escapeHtml(version.tag) + "</a>"
                : "") +
              "</div>" +
              "<p>" + escapeHtml(project.summary) + "</p>" +
              '<div class="project-tags">' +
              (project.stack || []).map(function (item) { return '<span class="tag">' + escapeHtml(item) + "</span>"; }).join("") +
              "</div>" +
              '<div class="project-links"><a href="' + repoUrl + '" target="_blank" rel="noopener">GitHub</a>' +
              (docsUrl ? '<a href="' + escapeHtml(docsUrl) + '" target="_blank" rel="noopener">Dokumentation</a>' : "") +
              "</div></article>"
            );
          })
          .join("");
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
          .map(function (release) {
            return (
              '<article class="update-card glass-card">' +
              '<div class="update-meta"><time datetime="' + escapeHtml(release.date) + '">' + escapeHtml(formatDate(release.date)) + "</time>" +
              '<span class="update-tag">' + escapeHtml(release.tag) + "</span></div>" +
              "<h3>" + release.title + "</h3><p>" + release.body + "</p></article>"
            );
          })
          .join("");
      })
      .catch(function () {
        releaseList.innerHTML = '<div class="empty-state">Releases gerade nicht abrufbar.</div>';
      });
  }
})();
