// Hornofino — small touches of interactivity

// Current year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav toggle
const nav = document.querySelector(".nav");
const burger = document.querySelector(".nav__burger");
burger?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});
// Close the mobile menu after a link is tapped
nav?.querySelectorAll(".nav__links a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    burger?.setAttribute("aria-expanded", "false");
  })
);

// Reveal-on-scroll for major blocks
const revealTargets = document.querySelectorAll(
  ".story, .menu, .order, .locations, .reviews, .section-head, .card, .place, .quote, .value, .faq__item, .signature, .timeline__row, .pullquote, .ritual__act, .pane__body"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

// "Why we bake" — scroll lights each sensory line in turn (scroll-driven, no rAF)
const senses = document.querySelector(".senses");
if (senses && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const senseLines = senses.querySelectorAll(".senses__line");
  let litIdx = -2;
  const lightLines = () => {
    const r = senses.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if (total <= 0) return;
    const p = Math.min(0.999, Math.max(0, -r.top / total));
    const idx = r.top > 0 ? -1 : Math.floor(p * senseLines.length);
    if (idx === litIdx) return;
    litIdx = idx;
    senseLines.forEach((l, i) => {
      l.classList.toggle("is-lit", i === idx);
      l.classList.toggle("was-lit", i < idx);
    });
  };
  window.addEventListener("scroll", lightLines, { passive: true });
  lightLines();
}

// Contact / order form — demo confirmation, no network call
const orderForm = document.getElementById("orderForm");
orderForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!orderForm.checkValidity()) {
    orderForm.reportValidity();
    return;
  }
  const success = document.getElementById("formSuccess");
  orderForm.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
  success?.classList.add("show");
  success?.scrollIntoView({ behavior: "smooth", block: "center" });
});

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // stagger siblings inside card grids as they enter together
          const grid = el.closest(".values__grid, .menu__grid, .reviews__grid, .locations__grid");
          if (grid) {
            const i = Array.prototype.indexOf.call(grid.children, el);
            if (i > 0) {
              el.style.transitionDelay = `${Math.min(i, 4) * 90}ms`;
              el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
            }
          }
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-in"));
}
