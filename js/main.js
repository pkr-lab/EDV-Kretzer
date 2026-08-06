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

  /* ---------- Aktuelles Jahr im Footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
