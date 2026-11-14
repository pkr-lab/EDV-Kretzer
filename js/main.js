/* =========================================================
   EDV-Kretzer – Haupt-JavaScript (Vanilla JS, keine Abhängigkeiten)
   Navigation, Info-Banner, Status-Hinweis
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Sticky Header Shadow ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile Navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (navToggle && mobileMenu) {
    var closeMenu = function () {
      navToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    };
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu.classList.toggle("open", !isOpen);
      document.body.style.overflow = !isOpen ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Aktiven Navigationslink markieren ---------- */
  // Seitenname aus Pfad oder Link: "/projekt/", "projekt.html#x" und "projekt" ergeben "projekt", die Startseite "index"
  function pageName(path) {
    var name = path.split("#")[0].split("?")[0].replace(/\/$/, "").split("/").pop().replace(/\.html$/, "");
    return name || "index";
  }
  var currentPage = pageName(location.pathname);
  document.querySelectorAll(".nav-links a, .mobile-menu a, .footer-col a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) return;
    if (pageName(href) === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Dropdown-Navigation ("Projekt") ---------- */
  document.querySelectorAll(".nav-dropdown").forEach(function (dropdown) {
    var trigger = dropdown.querySelector(".nav-dropdown-trigger");
    var menu = dropdown.querySelector(".nav-dropdown-menu");
    if (!trigger || !menu) return;

    if (menu.querySelector('a[aria-current="page"]')) {
      trigger.classList.add("active");
    }

    trigger.addEventListener("click", function () {
      var isOpen = dropdown.classList.contains("open");
      document.querySelectorAll(".nav-dropdown.open").forEach(function (d) {
        d.classList.remove("open");
        d.querySelector(".nav-dropdown-trigger").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        dropdown.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", function (e) {
    document.querySelectorAll(".nav-dropdown.open").forEach(function (d) {
      if (!d.contains(e.target)) {
        d.classList.remove("open");
        d.querySelector(".nav-dropdown-trigger").setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".nav-dropdown.open").forEach(function (d) {
        d.classList.remove("open");
        d.querySelector(".nav-dropdown-trigger").setAttribute("aria-expanded", "false");
      });
    }
  });

  /* ---------- Info-/Datenschutz-Banner ---------- */
  var banner = document.querySelector(".info-banner");
  if (banner) {
    var STORAGE_KEY = "edvkretzer_info_banner_dismissed";
    var accept = document.querySelector("[data-banner-accept]");
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTimeout(function () { banner.classList.add("visible"); }, 800);
      }
    } catch (e) {
      setTimeout(function () { banner.classList.add("visible"); }, 800);
    }
    if (accept) {
      accept.addEventListener("click", function () {
        banner.classList.remove("visible");
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
      });
    }
  }

  /* ---------- Status-Hinweis (data/status.json) ---------- */
  var statusLevels = { maintenance: "Wartung", incident: "Störung", info: "Hinweis" };
  var formatStatusDate = function (value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  fetch("data/status.json", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (status) {
      if (!status || status.active !== true) return;
      var until = status.until ? new Date(status.until) : null;
      if (until && !isNaN(until.getTime()) && until.getTime() < Date.now()) return;
      var level = statusLevels[status.level] ? status.level : "info";
      var box = document.createElement("div");
      box.className = "status-banner status-" + level;
      box.setAttribute("role", "status");
      var title = document.createElement("strong");
      title.textContent = status.title || statusLevels[level];
      var text = document.createElement("span");
      text.textContent = status.message || "";
      box.appendChild(title);
      box.appendChild(text);
      if (Array.isArray(status.areas) && status.areas.length) {
        var areas = document.createElement("span");
        areas.textContent = "Betroffen: " + status.areas.join(", ");
        box.appendChild(areas);
      }
      var since = formatStatusDate(status.since);
      var end = until ? formatStatusDate(status.until) : "";
      if (since || end) {
        var meta = document.createElement("small");
        meta.textContent = (since ? "Seit " + since : "") + (since && end ? " · " : "") + (end ? "voraussichtlich bis " + end : "");
        box.appendChild(meta);
      }
      document.body.insertBefore(box, document.body.firstChild);

      /* Wartung am gesamten Cluster: zusätzlich ein Block ganz oben (Startseite und Updates) */
      var slot = document.querySelector("[data-status-block]");
      var clusterWide = Array.isArray(status.areas) && status.areas.indexOf("Gesamter Cluster") !== -1;
      if (slot && level === "maintenance" && clusterWide) {
        var block = document.createElement("div");
        block.className = "status-block";
        block.setAttribute("role", "status");
        var blockTitle = document.createElement("h2");
        blockTitle.textContent = "Wartung am gesamten Cluster";
        var blockLead = document.createElement("p");
        blockLead.className = "status-block-lead";
        blockLead.textContent = "Während der Wartung ist kein Service erreichbar.";
        block.appendChild(blockTitle);
        block.appendChild(blockLead);
        if (status.message) {
          var blockText = document.createElement("p");
          blockText.textContent = status.message;
          block.appendChild(blockText);
        }
        if (since || end) {
          var blockMeta = document.createElement("p");
          blockMeta.className = "status-block-meta";
          blockMeta.textContent = (since ? "Seit " + since : "") + (since && end ? " · " : "") + (end ? "voraussichtlich bis " + end : "");
          block.appendChild(blockMeta);
        }
        slot.appendChild(block);
      }
    })
    .catch(function () {});

  /* ---------- Aktuelles Jahr im Footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
