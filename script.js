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
  ".story, .menu, .order, .locations, .reviews, .section-head, .card, .place, .quote"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-in"));
}
