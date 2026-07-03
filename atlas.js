/* ============================================================
   Hornofino — Atlas globe scroll journey (Three.js / WebGL)

   A marble Atlas kneels under a bronze celestial globe. The
   section pins while you scroll; scroll progress orbits the
   camera around the globe, revealing menu panels arranged in
   a ring. Panels are PLACEHOLDERS — swap `src` in PANELS below
   to assign real images (label shows over each panel).

   - Sticky scrollytelling: .atlas is tall, .atlas__sticky pins.
   - Renders only while the section is near the viewport.
   - prefers-reduced-motion: renders a single static frame.
   ============================================================ */
import * as THREE from "three";

(function () {
  "use strict";

  var canvas = document.getElementById("atlasCanvas");
  var section = document.getElementById("atlas");
  var labelEl = document.getElementById("atlasLabel");
  var hintEl = document.getElementById("atlasHint");
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
  var MARBLE  = 0xf2ece1;
  var MARBLE2 = 0xe0d8c8;
  var ORANGE  = 0xfc4c02;
  var BRONZE  = 0x9a6a33;
  var DARKB   = 0x2a1d12;

  // ---------- renderer / scene / camera ----------
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.5 : 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 1, 6000);

  function size() {
    var w = section.clientWidth || window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();
  window.addEventListener("resize", size);

  // lights
  scene.add(new THREE.AmbientLight(0xfff2e2, 0.9));
  var sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(400, 700, 500);
  scene.add(sun);
  var glow = new THREE.PointLight(ORANGE, 60000, 0, 2);    // ember at the globe's heart
  glow.position.set(0, 330, 0);
  scene.add(glow);
  var up = new THREE.PointLight(0xffd9b0, 60000, 0, 2);    // warm uplight on Atlas
  up.position.set(0, 40, 260);
  scene.add(up);

  // ---------- materials ----------
  var marbleMat  = new THREE.MeshStandardMaterial({ color: MARBLE,  roughness: 0.55, metalness: 0.05 });
  var marble2Mat = new THREE.MeshStandardMaterial({ color: MARBLE2, roughness: 0.7,  metalness: 0.05 });
  var bronzeMat  = new THREE.MeshStandardMaterial({ color: BRONZE,  roughness: 0.35, metalness: 0.65 });
  var orangeMat  = new THREE.MeshStandardMaterial({ color: ORANGE,  roughness: 0.3,  metalness: 0.2, emissive: ORANGE, emissiveIntensity: 0.45 });
  var darkMat    = new THREE.MeshStandardMaterial({ color: DARKB,   roughness: 0.6,  metalness: 0.2 });

  function mesh(geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    return m;
  }

  // ============================================================
  // ATLAS — kneeling titan, built from primitives (marble)
  // Local origin at ground centre. He holds the globe overhead.
  // ============================================================
  var atlas = new THREE.Group();
  (function buildAtlas() {
    // rocky base
    var rock = mesh(new THREE.DodecahedronGeometry(95, 0), marble2Mat, 0, -18, 0);
    rock.scale.set(1.5, 0.42, 1.2);
    atlas.add(rock);

    // kneeling leg (his right): knee down, shin flat behind
    atlas.add(mesh(new THREE.CylinderGeometry(13, 15, 62, 12), marbleMat, -32, 44, -6, 0.9, 0, 0.25));  // thigh
    atlas.add(mesh(new THREE.CylinderGeometry(11, 12, 56, 12), marbleMat, -40, 16, -44, 1.5, 0, 0));    // shin
    // planted leg (his left): foot forward, knee up
    atlas.add(mesh(new THREE.CylinderGeometry(13, 15, 60, 12), marbleMat, 36, 52, 18, -0.75, 0, -0.2)); // thigh
    atlas.add(mesh(new THREE.CylinderGeometry(11, 12, 58, 12), marbleMat, 44, 32, 46, 0.55, 0, 0));     // shin
    atlas.add(mesh(new THREE.BoxGeometry(20, 10, 34), marbleMat, 46, 6, 66));                            // foot

    // hips / torso leaning forward under the weight
    atlas.add(mesh(new THREE.SphereGeometry(26, 16, 12), marbleMat, 0, 86, 0));
    var torso = mesh(new THREE.CylinderGeometry(28, 24, 78, 16), marbleMat, 0, 128, 8, 0.28, 0, 0);
    atlas.add(torso);
    atlas.add(mesh(new THREE.SphereGeometry(30, 18, 14), marbleMat, 0, 168, 16));                        // chest/shoulders

    // head bowed under the burden
    atlas.add(mesh(new THREE.CylinderGeometry(9, 11, 16, 10), marbleMat, 0, 192, 24, 0.5, 0, 0));
    var head = mesh(new THREE.SphereGeometry(17, 18, 14), marbleMat, 0, 206, 34, 0.55, 0, 0);
    atlas.add(head);

    // arms raised to the globe (hands near its underside)
    atlas.add(mesh(new THREE.CylinderGeometry(9, 11, 62, 12), marbleMat, -44, 202, 18, 0, 0, 0.55));     // upper L
    atlas.add(mesh(new THREE.CylinderGeometry(8, 9, 58, 12), marbleMat, -62, 252, 12, 0, 0, 0.18));      // fore L
    atlas.add(mesh(new THREE.SphereGeometry(9, 10, 8), marbleMat, -66, 282, 10));                        // hand L
    atlas.add(mesh(new THREE.CylinderGeometry(9, 11, 62, 12), marbleMat, 44, 202, 18, 0, 0, -0.55));     // upper R
    atlas.add(mesh(new THREE.CylinderGeometry(8, 9, 58, 12), marbleMat, 62, 252, 12, 0, 0, -0.18));      // fore R
    atlas.add(mesh(new THREE.SphereGeometry(9, 10, 8), marbleMat, 66, 282, 10));                         // hand R

    // draped cloth hint across the hips
    atlas.add(mesh(new THREE.TorusGeometry(27, 6, 8, 20, Math.PI * 1.1), marble2Mat, 0, 84, 4, 0.2, 0, 2.6));
  })();
  scene.add(atlas);

  // ============================================================
  // GLOBE — bronze celestial lattice with a glowing equator band
  // ============================================================
  var GLOBE_C = new THREE.Vector3(0, 372, 10); // rests just above his hands
  var GLOBE_R = 96;
  var globe = new THREE.Group();
  globe.position.copy(GLOBE_C);
  (function buildGlobe() {
    globe.add(mesh(new THREE.SphereGeometry(GLOBE_R - 4, 28, 20), darkMat, 0, 0, 0)); // dark core
    var lattice = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(GLOBE_R, 16, 10)),
      new THREE.LineBasicMaterial({ color: BRONZE, transparent: true, opacity: 0.75 })
    );
    globe.add(lattice);
    // glowing meander-equator + tropics
    globe.add(mesh(new THREE.TorusGeometry(GLOBE_R + 2, 2.4, 8, 64), orangeMat, 0, 0, 0, Math.PI / 2, 0, 0));
    var tropic = new THREE.MeshStandardMaterial({ color: BRONZE, roughness: 0.4, metalness: 0.6 });
    globe.add(mesh(new THREE.TorusGeometry(GLOBE_R * 0.82, 1.4, 6, 48), tropic, 0, GLOBE_R * 0.5, 0, Math.PI / 2, 0, 0));
    globe.add(mesh(new THREE.TorusGeometry(GLOBE_R * 0.82, 1.4, 6, 48), tropic, 0, -GLOBE_R * 0.5, 0, Math.PI / 2, 0, 0));
  })();
  scene.add(globe);

  // ============================================================
  // PANELS — ring of placeholder cards orbiting the globe
  // ============================================================
  var RING_R = 260;
  var PANEL_W = 170, PANEL_H = 128;
  var panelMeshes = [];
  var texLoader = new THREE.TextureLoader();

  function placeholderTexture(i, label) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 384;
    var g = c.getContext("2d");
    g.fillStyle = "#fdf3ea"; g.fillRect(0, 0, 512, 384);
    g.strokeStyle = "#fc4c02"; g.lineWidth = 14; g.strokeRect(12, 12, 488, 360);
    // greek-key corners
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
    var theta = ((i + 1) / (PANELS.length + 1)) * Math.PI * 2;  // spread; camera loops back to start
    var tex = p.src ? texLoader.load(p.src, function (t) { t.colorSpace = THREE.SRGBColorSpace; })
                    : placeholderTexture(i, p.label);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), mat);
    m.position.set(GLOBE_C.x + RING_R * Math.sin(theta), GLOBE_C.y, GLOBE_C.z + RING_R * Math.cos(theta));
    m.rotation.y = theta;                    // face outward toward the orbiting camera
    m.userData = { theta: theta, label: p.label };
    // thin bronze frame just behind
    var frame = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W + 10, PANEL_H + 10),
      new THREE.MeshStandardMaterial({ color: BRONZE, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0 }));
    frame.position.copy(m.position).addScaledVector(new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta)), -2);
    frame.rotation.y = theta;
    scene.add(frame);
    m.userData.frame = frame;
    scene.add(m);
    panelMeshes.push(m);
  });

  // ---------- scroll progress within the pinned section ----------
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

  // ---------- camera orbit ----------
  var CAM_DIST = 640;
  var CAM_H = 60;       // above globe centre
  var LOOK = new THREE.Vector3(0, 300, 0);

  function placeCamera(p) {
    var theta = p * Math.PI * 2;                       // one full orbit
    var dip = Math.sin(p * Math.PI) * 70;              // sweep slightly down mid-orbit
    camera.position.set(
      GLOBE_C.x + CAM_DIST * Math.sin(theta),
      GLOBE_C.y + CAM_H - dip * 0.4 + 40 * (1 - Math.min(1, p * 6)), // start a touch higher, seeing Atlas
      GLOBE_C.z + CAM_DIST * Math.cos(theta)
    );
    // at the start, look lower to frame Atlas' whole body; settle on the globe as the orbit begins
    camera.lookAt(LOOK.x, LOOK.y - (1 - Math.min(1, p * 4)) * 60, LOOK.z);
    return theta;
  }

  var TWO_PI = Math.PI * 2;
  function angDiff(a, b) {
    var d = Math.abs(a - b) % TWO_PI;
    return d > Math.PI ? TWO_PI - d : d;
  }

  // ---------- caption ----------
  var lastLabel = "";
  function caption(theta) {
    var best = null, bestD = Infinity;
    panelMeshes.forEach(function (m) {
      var d = angDiff(theta, m.userData.theta);
      if (d < bestD) { bestD = d; best = m; }
    });
    var text = bestD < 0.42 && best ? best.userData.label : "Ο Άτλας — he carries the whole menu";
    if (labelEl && text !== lastLabel) { labelEl.textContent = text; lastLabel = text; }
    if (hintEl) hintEl.style.opacity = progress() > 0.02 ? "0" : "1";
  }

  // ---------- loop ----------
  function frame(now) {
    if (nearViewport()) {
      var p = REDUCED ? 0 : progress();
      var theta = placeCamera(p);

      // panel visibility: fade in by angular closeness to the camera
      panelMeshes.forEach(function (m) {
        var d = angDiff(theta, m.userData.theta);
        var o = Math.max(0, Math.min(1, 1.45 - d * 1.6));
        if (p < 0.01) o = 0;                         // hidden until the orbit begins
        m.material.opacity = o;
        m.userData.frame.material.opacity = o * 0.85;
        var s = 1 + Math.max(0, 0.5 - d) * 0.35;     // slight pop when centred
        m.scale.setScalar(s);
      });

      globe.rotation.y = now * 0.00012;              // slow idle spin of the lattice
      atlas.rotation.y = 0;                          // Atlas holds still; the world turns

      caption(theta);
      renderer.render(scene, camera);
    }
    if (!REDUCED) requestAnimationFrame(frame);
  }

  if (REDUCED) {
    // single static frame
    placeCamera(0);
    renderer.render(scene, camera);
    if (hintEl) hintEl.style.display = "none";
  } else {
    requestAnimationFrame(frame);
  }
})();
