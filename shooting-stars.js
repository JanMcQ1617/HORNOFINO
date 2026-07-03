/* ============================================================
   Hornofino — Shooting Stars (vanilla port)

   Faithful vanilla-JS port of the shadcn/React `ShootingStars`
   component (components/ui/shooting-stars.tsx). Same algorithm:
   a star spawns on a random screen edge with a fixed diagonal
   angle, travels, grows with distance, and leaves a gradient
   trail; when it exits, another spawns after a random delay.

   Ported because this site is vanilla HTML/CSS/JS (no React/JSX
   runtime). Colours are tuned to the brand (white / gold / ember)
   instead of the demo's neon. Scoped to the Atlas night section;
   disabled under prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var section = document.getElementById("atlas");
  var stage = document.querySelector(".atlas__sticky");
  if (!section || !stage) return;

  var SVGNS = "http://www.w3.org/2000/svg";

  // one SVG canvas holds every layer's stars + shared gradients
  var svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("id", "shootingStars");
  svg.setAttribute("class", "shooting-stars");
  var defs = document.createElementNS(SVGNS, "defs");
  svg.appendChild(defs);
  stage.appendChild(svg);

  // brand layers ~ the demo's three-layer setup, recoloured
  var LAYERS = [
    { starColor: "#ffffff", trailColor: "#fc4c02", minSpeed: 16, maxSpeed: 36, minDelay: 1400, maxDelay: 3600, starWidth: 12, starHeight: 1 },
    { starColor: "#f3c877", trailColor: "#ffd9b0", minSpeed: 11, maxSpeed: 26, minDelay: 2400, maxDelay: 5200, starWidth: 10, starHeight: 1 },
    { starColor: "#ffe9c4", trailColor: "#fc4c02", minSpeed: 20, maxSpeed: 42, minDelay: 2000, maxDelay: 4600, starWidth: 14, starHeight: 1 }
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function getRandomStartPoint() {
    var side = Math.floor(Math.random() * 4);
    var offset = Math.random() * window.innerWidth;
    switch (side) {
      case 0: return { x: offset, y: 0, angle: 45 };
      case 1: return { x: window.innerWidth, y: offset, angle: 135 };
      case 2: return { x: offset, y: window.innerHeight, angle: 225 };
      case 3: return { x: 0, y: offset, angle: 315 };
      default: return { x: 0, y: 0, angle: 45 };
    }
  }

  function nearViewport() {
    var r = section.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  var idc = 0;
  var layers = LAYERS.map(function (cfg, i) {
    // gradient per layer (trail fades from transparent trailColor -> solid starColor)
    var grad = document.createElementNS(SVGNS, "linearGradient");
    var gid = "ss-grad-" + i;
    grad.setAttribute("id", gid);
    grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "100%");
    var s0 = document.createElementNS(SVGNS, "stop");
    s0.setAttribute("offset", "0%");
    s0.setAttribute("style", "stop-color:" + cfg.trailColor + ";stop-opacity:0");
    var s1 = document.createElementNS(SVGNS, "stop");
    s1.setAttribute("offset", "100%");
    s1.setAttribute("style", "stop-color:" + cfg.starColor + ";stop-opacity:1");
    grad.appendChild(s0); grad.appendChild(s1);
    defs.appendChild(grad);
    return { cfg: cfg, gid: gid, star: null, rect: null };
  });

  function spawn(layer) {
    var p = getRandomStartPoint();
    layer.star = {
      id: ++idc, x: p.x, y: p.y, angle: p.angle,
      scale: 1, speed: rand(layer.cfg.minSpeed, layer.cfg.maxSpeed), distance: 0
    };
    if (!layer.rect) {
      layer.rect = document.createElementNS(SVGNS, "rect");
      layer.rect.setAttribute("height", String(layer.cfg.starHeight));
      layer.rect.setAttribute("fill", "url(#" + layer.gid + ")");
      svg.appendChild(layer.rect);
    }
    layer.rect.style.display = "";
    setTimeout(function () { spawn(layer); }, rand(layer.cfg.minDelay, layer.cfg.maxDelay));
  }

  function step(layer) {
    var st = layer.star;
    if (!st) { if (layer.rect) layer.rect.style.display = "none"; return; }
    var rad = (st.angle * Math.PI) / 180;
    st.x += st.speed * Math.cos(rad);
    st.y += st.speed * Math.sin(rad);
    st.distance += st.speed;
    st.scale = 1 + st.distance / 100;
    if (st.x < -20 || st.x > window.innerWidth + 20 || st.y < -20 || st.y > window.innerHeight + 20) {
      layer.star = null;
      if (layer.rect) layer.rect.style.display = "none";
      return;
    }
    var w = layer.cfg.starWidth * st.scale;
    var r = layer.rect;
    r.setAttribute("x", String(st.x));
    r.setAttribute("y", String(st.y));
    r.setAttribute("width", String(w));
    r.setAttribute("transform", "rotate(" + st.angle + ", " + (st.x + w / 2) + ", " + (st.y + layer.cfg.starHeight / 2) + ")");
  }

  function loop() {
    var visible = nearViewport();
    svg.style.opacity = visible ? "1" : "0";
    if (visible) layers.forEach(step);
    requestAnimationFrame(loop);
  }

  layers.forEach(spawn);
  requestAnimationFrame(loop);
})();
