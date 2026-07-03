/* ============================================================
   Hornofino — Atlas hero: 3D scroll orbit (Three.js / WebGL)

   Atlas kneels under a marble celestial globe — modelled on the
   classical reference: globe resting on his shoulders, arms up
   and back steadying it, one knee down, head bowed, stone base.

   The hero section pins while you scroll; progress orbits the
   camera 360° around the globe, revealing menu panels arranged
   in a ring. Panels are PLACEHOLDERS — set `src` in PANELS.

   If `assets/atlas.glb` exists (generated from the reference
   photo), it automatically replaces the primitive statue and
   the ring re-centres on the model's globe.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function () {
  "use strict";

  var canvas = document.getElementById("atlasCanvas");
  var section = document.getElementById("atlas");
  var labelEl = document.getElementById("atlasLabel");
  var hintEl = document.getElementById("atlasHint");
  var heroEl = document.getElementById("atlasHero");
  if (!canvas || !section) return;

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------
  // PLACEHOLDER PANELS — assign images later by setting `src`
  // e.g. { label: "Baklava", src: "assets/pastries.png" }
  // ------------------------------------------------------------
  var PANELS = [
    { label: "Placeholder 1", src: null },
    { label: "Placeholder 2", src: null },
    { label: "Placeholder 3", src: null },
    { label: "Placeholder 4", src: null },
    { label: "Placeholder 5", src: null },
    { label: "Placeholder 6", src: null },
    { label: "Placeholder 7", src: null },
    { label: "Placeholder 8", src: null }
  ];

  // ---------- palette ----------
  var MARBLE  = 0xf0e9db;
  var MARBLE2 = 0xdfd5c2;
  var ORANGE  = 0xfc4c02;
  var BRONZE  = 0x9a6a33;

  // ---------- renderer / scene / camera ----------
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.5 : 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 1, 8000);

  function size() {
    var w = section.clientWidth || window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();
  window.addEventListener("resize", size);

  // lights — warm museum key + brand ember
  scene.add(new THREE.AmbientLight(0xfff2e2, 0.85));
  var sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(500, 800, 600);
  scene.add(sun);
  var ember = new THREE.PointLight(ORANGE, 50000, 0, 2);
  ember.position.set(-260, 120, 260);
  scene.add(ember);
  var fill = new THREE.PointLight(0xffd9b0, 45000, 0, 2);
  fill.position.set(0, 60, 320);
  scene.add(fill);

  // ---------- materials ----------
  var marbleMat  = new THREE.MeshStandardMaterial({ color: MARBLE,  roughness: 0.5,  metalness: 0.04 });
  var marble2Mat = new THREE.MeshStandardMaterial({ color: MARBLE2, roughness: 0.68, metalness: 0.04 });
  var bronzeMat  = new THREE.MeshStandardMaterial({ color: BRONZE,  roughness: 0.35, metalness: 0.65 });
  var orangeMat  = new THREE.MeshStandardMaterial({ color: ORANGE,  roughness: 0.35, metalness: 0.2, emissive: ORANGE, emissiveIntensity: 0.35 });

  function mesh(geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    return m;
  }

  // ------------------------------------------------------------
  // RIG — shared layout targets (updated if the GLB loads)
  // ------------------------------------------------------------
  var RIG = {
    globeC: new THREE.Vector3(0, 400, -6),  // globe centre
    globeR: 132,                            // globe radius
    lookY: 300                              // orbit look-at height
  };

  // ============================================================
  // PRIMITIVE ATLAS (reference pose) — replaced by GLB if present
  // ============================================================
  var statueGroup = new THREE.Group();
  (function buildAtlas() {
    // octagonal stone base
    statueGroup.add(mesh(new THREE.CylinderGeometry(112, 122, 22, 8), marble2Mat, 0, 11, 0));

    // kneeling leg (his right): knee down at rear, shin flat back
    statueGroup.add(mesh(new THREE.CylinderGeometry(15, 17, 78, 12), marbleMat, -28, 96, -22, 1.15, 0, 0.28)); // thigh down-back
    statueGroup.add(mesh(new THREE.SphereGeometry(15, 12, 10), marbleMat, -44, 40, -52));                       // knee at ground
    statueGroup.add(mesh(new THREE.CylinderGeometry(12, 13, 64, 12), marbleMat, -44, 32, -86, 1.52, 0, 0));     // shin flat
    statueGroup.add(mesh(new THREE.BoxGeometry(20, 12, 30), marbleMat, -44, 30, -122));                          // foot back

    // planted leg (his left): knee up, foot forward
    statueGroup.add(mesh(new THREE.CylinderGeometry(15, 17, 74, 12), marbleMat, 36, 118, 26, -0.9, 0, -0.15));  // thigh forward-up
    statueGroup.add(mesh(new THREE.SphereGeometry(15, 12, 10), marbleMat, 44, 148, 58));                         // knee
    statueGroup.add(mesh(new THREE.CylinderGeometry(12, 13, 96, 12), marbleMat, 46, 98, 66, 0.18, 0, 0));       // shin down
    statueGroup.add(mesh(new THREE.BoxGeometry(22, 12, 38), marbleMat, 48, 28, 78));                             // foot

    // hips + torso, leaning slightly forward under the load
    statueGroup.add(mesh(new THREE.SphereGeometry(30, 16, 12), marbleMat, 0, 170, 0));
    statueGroup.add(mesh(new THREE.CylinderGeometry(31, 27, 92, 16), marbleMat, 0, 222, 8, 0.16, 0, 0));
    statueGroup.add(mesh(new THREE.SphereGeometry(34, 18, 14), marbleMat, 0, 272, 14));                          // chest/shoulders

    // head — forward of the globe, bowed; bearded
    statueGroup.add(mesh(new THREE.CylinderGeometry(10, 12, 16, 10), marbleMat, 0, 296, 34, 0.5, 0, 0));
    statueGroup.add(mesh(new THREE.SphereGeometry(18, 18, 14), marbleMat, 0, 312, 46, 0.5, 0, 0));               // head
    statueGroup.add(mesh(new THREE.ConeGeometry(10, 22, 10), marbleMat, 0, 296, 56, 0.7, 0, 0));                 // beard
    statueGroup.add(mesh(new THREE.SphereGeometry(19, 14, 10), marble2Mat, 0, 322, 40, 0.4, 0, 0));              // curls cap

    // arms — raised up and back, hands on the globe's lower sides
    statueGroup.add(mesh(new THREE.CylinderGeometry(10, 12, 70, 12), marbleMat, -52, 300, 4, 0.15, 0, 0.85));    // upper L
    statueGroup.add(mesh(new THREE.CylinderGeometry(9, 10, 62, 12), marbleMat, -86, 352, -4, 0.1, 0, 0.25));     // fore L
    statueGroup.add(mesh(new THREE.SphereGeometry(10, 10, 8), marbleMat, -95, 382, -6));                          // hand L
    statueGroup.add(mesh(new THREE.CylinderGeometry(10, 12, 70, 12), marbleMat, 52, 300, 4, 0.15, 0, -0.85));    // upper R
    statueGroup.add(mesh(new THREE.CylinderGeometry(9, 10, 62, 12), marbleMat, 86, 352, -4, 0.1, 0, -0.25));     // fore R
    statueGroup.add(mesh(new THREE.SphereGeometry(10, 10, 8), marbleMat, 95, 382, -6));                           // hand R

    // cloth drape over the left shoulder, falling to the hip
    statueGroup.add(mesh(new THREE.CylinderGeometry(8, 16, 120, 10), marble2Mat, 34, 226, 20, 0.1, 0, -0.22));
    statueGroup.add(mesh(new THREE.TorusGeometry(30, 7, 8, 20, Math.PI * 0.9), marble2Mat, 0, 168, 6, 0.3, 0, 2.8));

    // ---- celestial globe on his shoulders ----
    var globe = new THREE.Group();
    globe.position.copy(RIG.globeC);
    globe.name = "globe";
    globe.add(mesh(new THREE.SphereGeometry(RIG.globeR, 32, 24), marbleMat, 0, 0, 0));
    // faint engraved lattice
    var lattice = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(RIG.globeR + 0.6, 18, 12)),
      new THREE.LineBasicMaterial({ color: 0xc9bda6, transparent: true, opacity: 0.5 })
    );
    globe.add(lattice);
    // armillary rings — one equatorial (brand ember), two crossing diagonals (bronze)
    globe.add(mesh(new THREE.TorusGeometry(RIG.globeR + 3, 2.2, 8, 72), orangeMat, 0, 0, 0, Math.PI / 2, 0, 0));
    globe.add(mesh(new THREE.TorusGeometry(RIG.globeR + 2, 1.8, 8, 72), bronzeMat, 0, 0, 0, Math.PI / 2, 0, Math.PI / 3.2));
    globe.add(mesh(new THREE.TorusGeometry(RIG.globeR + 2, 1.8, 8, 72), bronzeMat, 0, 0, 0, Math.PI / 2, 0, -Math.PI / 3.2));
    statueGroup.add(globe);
  })();
  scene.add(statueGroup);

  // ============================================================
  // GLB auto-swap — drop assets/atlas.glb in and it takes over
  // ============================================================
  var activeStatue = statueGroup;  // whichever statue is on stage (primitives or GLB)

  new GLTFLoader().load("assets/atlas.glb", function (gltf) {
    var model = gltf.scene;
    model.traverse(function (o) { if (o.isMesh) { o.material = marbleMat; } });

    // fit: height 520, base on the ground, centred
    var box = new THREE.Box3().setFromObject(model);
    var sizeV = box.getSize(new THREE.Vector3());
    var scale = 520 / (sizeV.y || 1);
    model.scale.setScalar(scale);
    box.setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;

    scene.remove(statueGroup);
    // pivot group so drag/turntable spin happens around the statue's centre,
    // not the GLB file's arbitrary origin
    var pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    activeStatue = pivot;

    // in the reference, the globe's centre sits ~72% up, radius ~27% of height
    RIG.globeC.set(0, 520 * 0.72, 0);
    RIG.globeR = 520 * 0.27;
    RIG.lookY = 520 * 0.55;
    layoutRing();
  }, undefined, function () { /* no GLB yet — primitives stay */ });

  // ============================================================
  // PANELS — ring of placeholder cards around the globe
  // ============================================================
  var PANEL_W = 175, PANEL_H = 130;
  var panelMeshes = [];
  var texLoader = new THREE.TextureLoader();

  function placeholderTexture(i, label) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 384;
    var g = c.getContext("2d");
    g.fillStyle = "#fdf3ea"; g.fillRect(0, 0, 512, 384);
    g.strokeStyle = "#fc4c02"; g.lineWidth = 14; g.strokeRect(12, 12, 488, 360);
    g.fillStyle = "#fc4c02";
    [[28, 28], [452, 28], [28, 324], [452, 324]].forEach(function (p) {
      g.fillRect(p[0], p[1], 32, 8); g.fillRect(p[0], p[1], 8, 32);
    });
    g.fillStyle = "#d98a1e";
    g.font = "600 120px Georgia, serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(i + 1), 256, 168);
    g.fillStyle = "#241a12";
    g.font = "500 34px Futura, 'Trebuchet MS', sans-serif";
    g.fillText(label.toUpperCase(), 256, 292);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  PANELS.forEach(function (p, i) {
    var theta = ((i + 1) / (PANELS.length + 1)) * Math.PI * 2;
    var tex = p.src ? texLoader.load(p.src, function (t) { t.colorSpace = THREE.SRGBColorSpace; })
                    : placeholderTexture(i, p.label);
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W, PANEL_H),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 })
    );
    var frame = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W + 10, PANEL_H + 10),
      new THREE.MeshStandardMaterial({ color: BRONZE, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0 })
    );
    m.userData = { theta: theta, label: p.label, frame: frame };
    scene.add(frame);
    scene.add(m);
    panelMeshes.push(m);
  });

  function layoutRing() {
    var R = RIG.globeR + 150;
    panelMeshes.forEach(function (m) {
      var th = m.userData.theta;
      var dir = new THREE.Vector3(Math.sin(th), 0, Math.cos(th));
      m.position.copy(RIG.globeC).addScaledVector(dir, R);
      m.rotation.y = th;
      m.userData.frame.position.copy(m.position).addScaledVector(dir, -2);
      m.userData.frame.rotation.y = th;
    });
  }
  layoutRing();

  // ---------- scroll progress within the pinned hero ----------
  function progress() {
    var r = section.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / total));
  }
  function nearViewport() {
    var r = section.getBoundingClientRect();
    return r.bottom > -200 && r.top < window.innerHeight + 200;
  }

  // ---------- drag-to-spin + idle turntable (hero stage) ----------
  var statueRot = 0;          // current display rotation
  var userRot = 0;            // accumulated user drag
  var AUTO_VEL = 0.0025;      // slow museum turntable
  var autoPausedUntil = 0;    // resume auto-spin a moment after the user lets go
  var dragging = false;
  var lastX = 0;

  canvas.style.touchAction = "pan-y";   // horizontal drag spins; vertical still scrolls
  canvas.style.cursor = "grab";

  canvas.addEventListener("pointerdown", function (e) {
    if (progress() > 0.05) return;      // orbit has taken over — no manual spin
    dragging = true;
    lastX = e.clientX;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    userRot += (e.clientX - lastX) * 0.01;
    lastX = e.clientX;
    autoPausedUntil = performance.now() + 3000;
  }, { passive: true });
  window.addEventListener("pointerup", function () {
    dragging = false;
    canvas.style.cursor = "grab";
  });

  // ---------- camera orbit ----------
  function placeCamera(p) {
    var theta = p * Math.PI * 2;                 // one full orbit
    var dist = RIG.globeR * 4.6 + 40;
    var camY = RIG.globeC.y + 40 + (1 - Math.min(1, p * 5)) * 30;
    camera.position.set(
      RIG.globeC.x + dist * Math.sin(theta),
      camY - Math.sin(p * Math.PI) * 26,
      RIG.globeC.z + dist * Math.cos(theta)
    );
    // start framing the whole statue; settle onto the globe as the orbit begins
    var lookY = RIG.lookY - (1 - Math.min(1, p * 4)) * 40;
    camera.lookAt(RIG.globeC.x, lookY, RIG.globeC.z);
    return theta;
  }

  var TWO_PI = Math.PI * 2;
  function angDiff(a, b) {
    var d = Math.abs(a - b) % TWO_PI;
    return d > Math.PI ? TWO_PI - d : d;
  }

  // ---------- overlays ----------
  var lastLabel = "";
  function overlays(theta, p) {
    // hero copy fades as the orbit begins
    if (heroEl) {
      var o = Math.max(0, 1 - p * 4.5);
      heroEl.style.opacity = String(o);
      heroEl.style.pointerEvents = o < 0.35 ? "none" : "";
    }
    // caption: nearest facing panel
    var best = null, bestD = Infinity;
    panelMeshes.forEach(function (m) {
      var d = angDiff(theta, m.userData.theta);
      if (d < bestD) { bestD = d; best = m; }
    });
    var text = p > 0.03 && bestD < 0.42 && best ? best.userData.label : "";
    if (labelEl && text !== lastLabel) { labelEl.textContent = text; lastLabel = text; }
    if (hintEl) hintEl.style.opacity = p > 0.02 ? "0" : "1";
  }

  // ---------- loop ----------
  function frame(now) {
    if (nearViewport()) {
      var p = REDUCED ? 0 : progress();
      var theta = placeCamera(p);

      // statue spin: turntable + user drag at the top; eases home for the orbit
      if (p < 0.03 && !REDUCED) {
        if (!dragging && now > autoPausedUntil) userRot += AUTO_VEL;
        statueRot = userRot;
      } else {
        statueRot *= 0.92;                 // settle back so panels stay aligned
        userRot = statueRot;
      }
      activeStatue.rotation.y = statueRot;

      panelMeshes.forEach(function (m) {
        var d = angDiff(theta, m.userData.theta);
        var o = Math.max(0, Math.min(1, 1.45 - d * 1.6));
        if (p < 0.015) o = 0;
        m.material.opacity = o;
        m.userData.frame.material.opacity = o * 0.85;
        m.scale.setScalar(1 + Math.max(0, 0.5 - d) * 0.35);
      });

      overlays(theta, p);
      renderer.render(scene, camera);
    }
    if (!REDUCED) requestAnimationFrame(frame);
  }

  if (REDUCED) {
    placeCamera(0);
    renderer.render(scene, camera);
    if (hintEl) hintEl.style.display = "none";
  } else {
    requestAnimationFrame(frame);
  }
})();
