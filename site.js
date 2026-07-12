/* ============================================================
   HORNOFINO — shared interactions for inner pages
   Nav scroll state · scroll progress · mobile drawer ·
   reveal-on-scroll · magnetic buttons · menu jump-nav ·
   demo form handling · year · back-to-top.
   Cart logic stays in cart.js.
   ============================================================ */
(function () {
  "use strict";
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement;

  /* ---- Nav scroll state + progress bar ---- */
  var nav = document.querySelector(".nav");
  var sb = document.getElementById("scrollbar");
  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 30);
    if (sb) {
      var h = doc.scrollHeight - window.innerHeight;
      sb.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    }
    highlightJump();
  }

  /* ---- Mobile drawer ---- */
  var burger = document.getElementById("burger") || document.querySelector(".burger");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }
  document.querySelectorAll("#drawer a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---- Auto-tag common blocks for reveal (so pages animate without per-element markup) ---- */
  var autoReveal = ".menu-section,.signature,.value,.place,.timeline__row,.pullquote blockquote,.story__text,.story__img,.contact__info,.form,.section-head,.pp-card,.pp-course,.pp-lead__media,.pp-lead__copy";
  document.querySelectorAll(autoReveal).forEach(function (el) {
    if (!el.classList.contains("reveal") && !el.classList.contains("reveal-sm")) el.classList.add("reveal-sm");
  });

  /* ---- Reveal on scroll ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal,.reveal-sm,[data-stagger]").forEach(function (el) { io.observe(el); });
    document.querySelectorAll("[data-stagger]").forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.transitionDelay = (i * 85) + "ms"; });
    });
  } else {
    document.querySelectorAll(".reveal,.reveal-sm,[data-stagger]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Menu jump-nav: active highlight ---- */
  var jumpLinks = [].slice.call(document.querySelectorAll(".menu-jump a"));
  var jumpTargets = jumpLinks.map(function (a) {
    var id = a.getAttribute("href").slice(1);
    return document.getElementById(id);
  });
  function highlightJump() {
    if (!jumpLinks.length) return;
    var offset = 140, best = -1, bestTop = -Infinity;
    for (var i = 0; i < jumpTargets.length; i++) {
      var t = jumpTargets[i]; if (!t) continue;
      var top = t.getBoundingClientRect().top - offset;
      if (top <= 0 && top > bestTop) { bestTop = top; best = i; }
    }
    jumpLinks.forEach(function (a, i) { a.classList.toggle("active", i === best); });
  }

  /* ---- Magnetic buttons ---- */
  if (!RM && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(function (m) {
      var strength = 16;
      m.addEventListener("mousemove", function (e) {
        var r = m.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        m.style.transform = "translate(" + (x / r.width * strength) + "px," + (y / r.height * strength) + "px)";
      });
      m.addEventListener("mouseleave", function () { m.style.transform = ""; });
    });
  }

  /* ---- Embers ---- */
  document.querySelectorAll(".embers").forEach(function (host) {
    if (RM) return;
    for (var i = 0; i < 14; i++) {
      var e = document.createElement("i");
      e.style.left = (Math.random() * 100) + "%";
      e.style.animationDuration = (5 + Math.random() * 6) + "s";
      e.style.animationDelay = (-Math.random() * 8) + "s";
      var s = (3 + Math.random() * 5); e.style.width = e.style.height = s + "px";
      host.appendChild(e);
    }
  });

  /* ---- Add-to-cart: nav badge pop (cart.js handles storage) ---- */
  document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var badge = document.querySelector(".nav__cart");
      if (badge && badge.animate) {
        badge.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
          { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
      }
    });
  });

  /* ---- Demo order form (contact.html) ---- */
  var orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!orderForm.checkValidity()) { orderForm.reportValidity(); return; }
      var success = document.getElementById("formSuccess");
      orderForm.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
      if (success) { success.classList.add("show"); success.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); }
    });
  }

  /* ---- Misc ---- */
  var yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();
  var totop = document.getElementById("totop");
  if (totop) totop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }); });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
