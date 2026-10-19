/* =========================================================
   EDV-Kretzer – Haupt-JavaScript (Vanilla JS, keine Abhängigkeiten)
   Navigation, Scroll-Reveal, 3D-Tilt, Info-Banner
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
  var currentPage = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a, .mobile-menu a, .footer-col a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href) return;
    var hrefPage = href.split("#")[0] || "index.html";
    if (hrefPage === currentPage || (currentPage === "" && hrefPage === "index.html")) {
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

  /* ---------- Scroll Reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", i % 8);
      io.observe(el);
    });
    // Sicherheitsnetz: falls der Observer für einzelne Elemente aus
    // irgendeinem Grund nicht auslöst, bleiben Inhalte nicht dauerhaft
    // unsichtbar (z. B. bei zwischenzeitlich verstecktem Tab).
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("visible"); });
    }, 2500);
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- 3D Tilt: Monitor-Vorschau (Scroll + Maus) ---------- */
  var monitor = document.querySelector(".monitor-frame");
  if (monitor) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      var ticking = false;
      var updateTiltFromScroll = function () {
        var rect = monitor.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var center = rect.top + rect.height / 2;
        var progress = (vh / 2 - center) / (vh / 2); // -1 .. 1
        progress = Math.max(-1, Math.min(1, progress));
        var rotateX = 8 - progress * 14;
        var rotateY = -10 + progress * 8;
        monitor.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
        ticking = false;
      };
      window.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            window.requestAnimationFrame(updateTiltFromScroll);
            ticking = true;
          }
        },
        { passive: true }
      );
      updateTiltFromScroll();

      var wrap = document.querySelector(".alarm-monitor-3d");
      if (wrap) {
        wrap.addEventListener("mousemove", function (e) {
          var rect = wrap.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          monitor.style.transform = "rotateX(" + (8 - py * 16).toFixed(2) + "deg) rotateY(" + (-10 + px * 20).toFixed(2) + "deg)";
        });
        wrap.addEventListener("mouseleave", updateTiltFromScroll);
      }
    }
  }

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
      var since = formatStatusDate(status.since);
      var end = until ? formatStatusDate(status.until) : "";
      if (since || end) {
        var meta = document.createElement("small");
        meta.textContent = (since ? "Seit " + since : "") + (since && end ? " · " : "") + (end ? "voraussichtlich bis " + end : "");
        box.appendChild(meta);
      }
      document.body.insertBefore(box, document.body.firstChild);
    })
    .catch(function () {});

  /* ---------- Aktuelles Jahr im Footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
