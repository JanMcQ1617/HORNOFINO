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
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  // photoreal pipeline: filmic tone curve + correct colour + soft shadows
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;   // grey stone visible against the night, not washed out
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // shadows off: there's no floor to catch them, and self-shadowing was
  // blacking out the generated mesh

  var scene = new THREE.Scene();
  // image-based lighting — makes marble read as marble
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.fog = new THREE.Fog(0x05070f, 1500, 3600);   // night air

  var camera = new THREE.PerspectiveCamera(45, 1, 1, 12000);

  function pixelRatio(w) {
    if (window.innerWidth < 820) return Math.min(window.devicePixelRatio || 1, 1.5);
    // render into a ~4K internal buffer (supersampled if the display is lower-res)
    return Math.min(3840 / Math.max(1, w), 3);
  }
  function size() {
    var w = section.clientWidth || window.innerWidth;
    var h = window.innerHeight;
    renderer.setPixelRatio(pixelRatio(w));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();
  window.addEventListener("resize", size);

  // lights — bright, even museum lighting so the stone reads clearly at night
  scene.add(new THREE.AmbientLight(0xf4f1ea, 0.9));
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x2a2320, 1.1)); // cool sky / warm ground
  var sun = new THREE.DirectionalLight(0xfff6ec, 2.6);            // warm key, front-right
  sun.position.set(500, 700, 620);
  scene.add(sun);
  var camKey = new THREE.DirectionalLight(0xffffff, 1.2);         // camera-facing fill
  camKey.position.set(0, 300, 900);
  scene.add(camKey);
  var ember = new THREE.PointLight(ORANGE, 22000, 0, 2);          // brand rim accent
  ember.position.set(-320, 140, 220);
  scene.add(ember);

  // (no platform/floor — the statue floats in the night sky;
  //  shadows are self-cast on the marble itself)

  // ============================================================
  // NIGHT SKY — starfield + floating constellations, cursor-reactive
  // ============================================================
  var skyGroup = new THREE.Group();
  scene.add(skyGroup);

  function starLayer(count, radius, size, opacity) {
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var u = Math.random() * 2 - 1, phi = Math.random() * Math.PI * 2;
      var sq = Math.sqrt(1 - u * u), r = radius * (0.92 + Math.random() * 0.16);
      pos[i * 3] = sq * Math.cos(phi) * r;
      pos[i * 3 + 1] = u * r;
      pos[i * 3 + 2] = sq * Math.sin(phi) * r;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffffff, size: size, sizeAttenuation: true,
      transparent: true, opacity: opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    });
    return new THREE.Points(geo, mat);
  }
  var starsA = starLayer(2200, 3000, 9, 0.8);    // dense field
  var starsB = starLayer(700, 3600, 16, 0.55);   // sparse bright layer
  skyGroup.add(starsA); skyGroup.add(starsB);

  // simplified classical constellations (2D strokes draped on the sky shell)
  var CONSTELLATIONS = [
    { pts: [[0,0],[70,25],[150,15],[210,55],[185,115],[110,100],[45,70],[0,0]] },                 // Leo
    { pts: [[0,60],[60,30],[130,45],[130,45],[200,0],[130,45],[150,120]] },                        // Taurus
    { pts: [[0,0],[55,10],[110,0],[160,30],[110,70],[55,60],[0,0],[80,140]] },                     // Ursa
    { pts: [[0,40],[50,0],[100,45],[150,5],[200,50]] },                                            // Cassiopeia
    { pts: [[0,0],[40,60],[85,120],[40,60],[100,55],[40,60],[-20,70]] }                            // Lyra-ish
  ];
  var constGroups = [];
  CONSTELLATIONS.forEach(function (cst, i) {
    var group = new THREE.Group();
    var az = (i / CONSTELLATIONS.length) * Math.PI * 2 + 0.6;
    var el = 0.25 + (i % 3) * 0.18;                       // spread above the horizon
    var R = 2400;
    var dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    group.position.copy(dir.multiplyScalar(R));
    group.lookAt(0, 400, 0);

    var pts3 = cst.pts.map(function (p) { return new THREE.Vector3((p[0] - 100) * 2.4, (p[1] - 60) * 2.4, 0); });
    var line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts3),
      new THREE.LineBasicMaterial({ color: 0xf3c877, transparent: true, opacity: 0.38, fog: false })
    );
    group.add(line);
    var starGeo = new THREE.BufferGeometry().setFromPoints(pts3);
    group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffe9c4, size: 26, sizeAttenuation: true,
      transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    })));
    skyGroup.add(group);
    constGroups.push(group);
  });

  // cursor parallax for the sky (separate from statue dragging)
  var skyCX = 0, skyCY = 0;
  window.addEventListener("pointermove", function (e) {
    skyCX = e.clientX / window.innerWidth - 0.5;
    skyCY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // transparent nav while over the night hero, so the top blends into the sky
  var navEl = document.querySelector(".nav");
  var navLogo = navEl && navEl.querySelector(".nav__logo");
  function navSync() {
    if (!navEl) return;
    var clear = section.getBoundingClientRect().bottom > 90;
    navEl.classList.toggle("nav--clear", clear);
    if (navLogo) {
      var want = clear ? "assets/logo-white.png" : "assets/logo-dark.png";
      if (navLogo.getAttribute("src") !== want) navLogo.setAttribute("src", want);
    }
  }
  navSync();
  window.addEventListener("scroll", navSync, { passive: true });

  // ---------- materials ----------
  // procedural Carrara-style veining: warm cream ground, layered grey-gold veins
  function makeMarbleTexture(base, veinTone) {
    var c = document.createElement("canvas");
    c.width = c.height = 1024;
    var g = c.getContext("2d");
    g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
    // soft tonal clouds
    for (var k = 0; k < 26; k++) {
      var x = Math.random() * 1024, y = Math.random() * 1024, r = 90 + Math.random() * 240;
      var grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(190,178,155," + (0.05 + Math.random() * 0.06) + ")");
      grad.addColorStop(1, "rgba(190,178,155,0)");
      g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // wandering veins
    for (var v = 0; v < 60; v++) {
      var px = Math.random() * 1024, py = Math.random() * 1024;
      var ang = Math.random() * Math.PI * 2;
      g.beginPath(); g.moveTo(px, py);
      var segs = 6 + (Math.random() * 8) | 0;
      for (var s = 0; s < segs; s++) {
        ang += (Math.random() - 0.5) * 1.1;
        var len = 30 + Math.random() * 90;
        var nx = px + Math.cos(ang) * len, ny = py + Math.sin(ang) * len;
        g.quadraticCurveTo(px + (Math.random() - 0.5) * 40, py + (Math.random() - 0.5) * 40, nx, ny);
        px = nx; py = ny;
      }
      g.strokeStyle = "rgba(" + veinTone + "," + (0.04 + Math.random() * 0.08) + ")";
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  // weathered grey cast-stone / concrete, matte — matches the store statue
  var marbleTex  = makeMarbleTexture("#bdbbb3", "96,94,86");
  var marbleTex2 = makeMarbleTexture("#aba99f", "88,86,78");

  var marbleMat = new THREE.MeshPhysicalMaterial({
    map: marbleTex, bumpMap: marbleTex, bumpScale: 0.8,   // gritty stone relief
    color: 0xc3c1b8,                                       // cool-neutral stone
    roughness: 0.9, metalness: 0,
    clearcoat: 0.03, clearcoatRoughness: 0.75,             // matte, not polished
    envMapIntensity: 0.7
  });
  var marble2Mat = new THREE.MeshPhysicalMaterial({
    map: marbleTex2, bumpMap: marbleTex2, bumpScale: 0.9,
    color: 0xb4b2a8,
    roughness: 0.94, metalness: 0,
    clearcoat: 0.02, clearcoatRoughness: 0.85,
    envMapIntensity: 0.65
  });
  var bronzeMat  = new THREE.MeshStandardMaterial({ color: BRONZE,  roughness: 0.35, metalness: 0.65 });
  var orangeMat  = new THREE.MeshStandardMaterial({ color: ORANGE,  roughness: 0.35, metalness: 0.2, emissive: ORANGE, emissiveIntensity: 0.35 });

  function mesh(geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    m.castShadow = true;
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
  // Real-model auto-swap — priority:
  //   1. assets/atlas.stl  (a real photogrammetry scan, e.g. Farnese Atlas —
  //      most realistic; STL is geometry-only, we apply the stone in-engine)
  //   2. assets/atlas.glb  (current image-to-3D reconstruction)
  //   3. built-in primitives
  // Drop a better file in and it takes over on next load, no code changes.
  // ============================================================
  var activeStatue = statueGroup;
  var MODEL_TWEAK = { rotY: 0, standing: false };  // standing:true skips the globe ring offset

  function mountModel(root) {
    root.traverse(function (o) {
      if (!o.isMesh) return;
      // rebuild normals (scans/reconstructions often ship bad or missing ones)
      if (o.geometry) { o.geometry.deleteAttribute("normal"); o.geometry.computeVertexNormals(); }
      var m = marbleMat.clone();
      m.side = THREE.DoubleSide;
      o.material = m;
      o.castShadow = false; o.receiveShadow = false;
    });
    root.rotation.y = MODEL_TWEAK.rotY;

    // fit to height 520, base at y=0, centred on x/z
    var box = new THREE.Box3().setFromObject(root);
    var sv = box.getSize(new THREE.Vector3());
    root.scale.setScalar(520 / (sv.y || 1));
    box.setFromObject(root);
    var c = box.getCenter(new THREE.Vector3());
    root.position.x -= c.x; root.position.z -= c.z; root.position.y -= box.min.y;

    scene.remove(statueGroup);
    var pivot = new THREE.Group();  // spin around the statue centre, not the file origin
    pivot.add(root);
    scene.add(pivot);
    activeStatue = pivot;

    RIG.globeC.set(0, 520 * 0.72, 0);   // globe sits ~72% up
    RIG.globeR = 520 * 0.27;
    RIG.lookY = 520 * 0.55;
    layoutRing();
  }

  function loadGLB() {
    new GLTFLoader().load("assets/atlas.glb",
      function (gltf) { mountModel(gltf.scene); },
      undefined,
      function () { /* no GLB either — primitives stay */ });
  }

  // try the real scan first, fall back to the generated GLB
  new STLLoader().load("assets/atlas.stl",
    function (geo) {
      geo.center();
      mountModel(new THREE.Mesh(geo, marbleMat.clone()));
    },
    undefined,
    loadGLB);

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

      // living night sky: slow drift + cursor parallax + twinkle + floating constellations
      skyGroup.rotation.y = now * 0.000045 + skyCX * 0.22;
      skyGroup.rotation.x = skyCY * 0.11;
      starsA.material.opacity = 0.72 + Math.sin(now * 0.0011) * 0.1;
      starsB.material.opacity = 0.45 + Math.sin(now * 0.0007 + 2) * 0.14;
      for (var ci = 0; ci < constGroups.length; ci++) {
        constGroups[ci].rotation.z = Math.sin(now * 0.0002 + ci * 1.7) * 0.4;
        constGroups[ci].position.y += Math.sin(now * 0.0004 + ci * 2.3) * 0.4;
      }

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
