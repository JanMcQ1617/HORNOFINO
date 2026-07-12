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
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

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
  // MENU PLACEHOLDERS — a ring of cards orbits the globe. Replace
  // `label` with your menu item and set `src` to a photo when you
  // have one, e.g. { label: "Baklava", src: "assets/pastries.png" }.
  // Add or remove entries freely; the ring re-spaces automatically.
  // ------------------------------------------------------------
  // Real Hornofino categories, photos extracted from hornofino.com
  // (assets/menu-hf/). Leave src null to show the styled name card.
  var PANELS = [
    { label: "Mega Quesito", src: "assets/menu-hf/mega-quesito.jpg" },
    { label: "Panes",        src: "assets/menu-hf/panes.jpg" },
    { label: "Sandwiches",   src: "assets/menu-hf/sandwiches.jpg" },
    { label: "Desayuno",     src: "assets/menu-hf/desayuno.jpg" },
    { label: "Repostería",   src: "assets/menu-hf/reposteria.jpg" },
    { label: "Pastelería",   src: "assets/menu-hf/pasteleria.jpg" },
    { label: "Brunch",       src: "assets/menu-hf/brunch.jpg" },
    { label: "Café y Té",    src: "assets/menu-hf/cafe-y-te.jpg" }
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

  // lights — moody "statue in the void": low warm ambient, a warm ember key
  // from below-left and a cool rim from behind, echoing the approved video look
  scene.add(new THREE.AmbientLight(0x3a2f28, 0.42));                 // dim warm fill
  scene.add(new THREE.HemisphereLight(0x1b2536, 0x2a1a10, 0.5));     // cool sky / warm ground
  var sun = new THREE.DirectionalLight(0xffb066, 2.3);               // warm ember key, low-left
  sun.position.set(-420, 260, 520);
  scene.add(sun);
  var rim = new THREE.DirectionalLight(0x9fc0ff, 1.35);              // cool rim from behind
  rim.position.set(300, 520, -640);
  scene.add(rim);
  var camKey = new THREE.DirectionalLight(0xffe6cf, 0.45);           // gentle camera fill
  camKey.position.set(0, 240, 900);
  scene.add(camKey);
  var ember = new THREE.PointLight(ORANGE, 42000, 0, 2);             // ember accent glow
  ember.position.set(-320, 120, 240);
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
    globeC: new THREE.Vector3(0, 410, -6),  // globe centre
    globeR: 178,                            // globe radius — big stone world
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
    // big sphere carved from the same weathered stone as the statue
    globe.add(mesh(new THREE.SphereGeometry(RIG.globeR, 48, 36), marbleMat, 0, 0, 0));
    // faint carved latitude / longitude lines (grey stone, not metal)
    var lattice = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(RIG.globeR + 0.6, 24, 16)),
      new THREE.LineBasicMaterial({ color: 0x8f8578, transparent: true, opacity: 0.35 })
    );
    globe.add(lattice);
    // one subtle equatorial band, same stone tone (a whisper of an armillary)
    globe.add(mesh(new THREE.TorusGeometry(RIG.globeR + 2, 1.4, 8, 80), marble2Mat, 0, 0, 0, Math.PI / 2, 0, 0));
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
  // quick knobs (nudge if the scan lands rotated/upside-down or the drape is off)
  var MODEL_TWEAK = {
    rotY: 0, flipUp: false,   // front faces the establishing camera
    // procedural loincloth is OFF — the statue scan has its own carved cloth,
    // and the flat apron box read as a floating blank rectangle mid-orbit
    cloth: { show: false, x: 0, y: 258, z: 26, scale: 1.4, rotY: 0 }
  };

  function addLoincloth(pivot) {
    var t = MODEL_TWEAK.cloth;
    if (!t.show) return;
    var g = new THREE.Group();
    var clothMat = new THREE.MeshStandardMaterial({ color: 0xcac3b6, roughness: 0.93, metalness: 0, side: THREE.DoubleSide });
    // slim hip wrap around the waist
    var wrap = new THREE.Mesh(new THREE.TorusGeometry(50, 10, 14, 32), clothMat);
    wrap.rotation.x = Math.PI / 2; wrap.scale.set(1.02, 0.42, 1);
    g.add(wrap);
    // front apron / fold hanging over the groin
    var apron = new THREE.Mesh(new THREE.BoxGeometry(74, 96, 7), clothMat);
    apron.position.set(0, -50, 34); apron.rotation.x = 0.16;
    g.add(apron);
    g.position.set(t.x, t.y, t.z);
    g.scale.setScalar(t.scale);
    g.rotation.y = t.rotY;
    pivot.add(g);
  }

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
    addLoincloth(pivot);            // drape moves/rotates with the statue
    scene.add(pivot);
    activeStatue = pivot;

    RIG.globeC.set(0, 520 * 0.72, 0);   // globe sits ~72% up
    RIG.globeR = 520 * 0.27;
    RIG.lookY = 520 * 0.55;
    layoutRing();
  }

  // ?v bump forces browsers to re-fetch when the model file is replaced
  var GLB_URL = "assets/atlas.glb?v=hd3";
  function loadGLB() {
    var loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);   // model is meshopt-compressed
    loader.load(GLB_URL,
      function (gltf) { mountModel(gltf.scene); },
      undefined,
      loadSTL);   // no GLB — fall back to the raw scan
  }

  // orient a raw scan so its tallest axis stands up (Y); print/scan STLs vary
  function standUp(geo) {
    geo.computeBoundingBox();
    var s = geo.boundingBox.getSize(new THREE.Vector3());
    if (s.z >= s.y && s.z >= s.x) geo.rotateX(-Math.PI / 2);      // Z-up -> Y-up
    else if (s.x >= s.y && s.x >= s.z) geo.rotateZ(Math.PI / 2);  // X-up -> Y-up
    if (MODEL_TWEAK.flipUp) geo.rotateX(Math.PI);                 // if it lands upside down
    geo.center();
    return geo;
  }

  function loadSTL() {
    new STLLoader().load("assets/atlas.stl",
      function (geo) { mountModel(new THREE.Mesh(standUp(geo), marbleMat.clone())); },
      undefined,
      function () { /* no scan either — primitives stay */ });
  }

  // the brand statue reconstruction (atlas.glb, cleaned) is the model the
  // site is designed around — load it first; the generic scan is a fallback
  loadGLB();

  // ============================================================
  // PANELS — ring of placeholder cards around the globe
  // ============================================================
  var PANEL_W = 180, PANEL_H = 135;
  var panelMeshes = [];

  // gallery-card texture: dish photo in a warm cream matte with a gold
  // hairline, orange corner ticks and an inscriptional Cinzel caption
  function cardTexture(i, label, img) {
    var W = 640, H = 480;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.fillStyle = "#fdf3ea"; g.fillRect(0, 0, W, H);
    var pad = 24, capH = 92;
    var wx = pad, wy = pad, ww = W - pad * 2, wh = H - capH - pad * 1.4;
    if (img) {
      // cover-crop the photo into the window
      var ia = img.width / img.height, pa = ww / wh, sw, sh, sx, sy;
      if (ia > pa) { sh = img.height; sw = sh * pa; sx = (img.width - sw) / 2; sy = 0; }
      else { sw = img.width; sh = sw / pa; sx = 0; sy = (img.height - sh) / 2; }
      g.drawImage(img, sx, sy, sw, sh, wx, wy, ww, wh);
    } else {
      g.fillStyle = "#f6e7d6"; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = "#d98a1e";
      g.font = "600 130px Cinzel, Georgia, serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(i + 1), W / 2, wy + wh / 2 + 8);
    }
    // gold hairline around the photo window
    g.strokeStyle = "#d98a1e"; g.lineWidth = 3;
    g.strokeRect(wx + 1.5, wy + 1.5, ww - 3, wh - 3);
    // orange corner ticks
    g.strokeStyle = "#fc4c02"; g.lineWidth = 7; g.lineCap = "square";
    [[wx, wy, 1, 1], [wx + ww, wy, -1, 1], [wx, wy + wh, 1, -1], [wx + ww, wy + wh, -1, -1]].forEach(function (k) {
      g.beginPath();
      g.moveTo(k[0] + 36 * k[2], k[1]);
      g.lineTo(k[0], k[1]);
      g.lineTo(k[0], k[1] + 36 * k[3]);
      g.stroke();
    });
    // caption
    g.fillStyle = "#241a12";
    g.font = "500 40px Cinzel, Georgia, serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(label.toUpperCase(), W / 2, H - capH / 2 - 12);
    g.fillStyle = "#fc4c02";
    g.font = "22px Georgia, serif";
    g.fillText("·  Φ  ·", W / 2, H - 24);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  PANELS.forEach(function (p, i) {
    var theta = ((i + 1) / (PANELS.length + 1)) * Math.PI * 2;
    var mat = new THREE.MeshBasicMaterial({ map: cardTexture(i, p.label, null), transparent: true, opacity: 0 });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), mat);
    // soft charcoal backing plane — reads as a drop shadow behind the card
    var frame = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W + 8, PANEL_H + 8),
      new THREE.MeshBasicMaterial({ color: 0x120d09, transparent: true, opacity: 0 })
    );
    m.userData = { theta: theta, label: p.label, frame: frame };
    scene.add(frame);
    scene.add(m);
    panelMeshes.push(m);
    if (p.src) {
      var img = new Image();
      img.onload = function () {
        // rebuild once the photo (and the Cinzel face) are actually available
        var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        ready.then(function () { mat.map = cardTexture(i, p.label, img); mat.needsUpdate = true; });
      };
      img.src = p.src;
    }
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
  var AUTO_VEL = 0;          // static hero (drag to spin); orientation fixed by MODEL_TWEAK.rotY
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

  // ---------- camera: the full statue in frame from the first pixel;
  //            scroll simply orbits it once, no zoom-in phase ----------
  function placeCamera(p) {
    var gc = RIG.globeC;
    var dist = RIG.globeR * 5.0;        // wide enough to hold base-to-globe at 45° fov
    var theta = p * Math.PI * 2;        // one full orbit across the pinned scroll
    camera.position.set(
      gc.x + dist * Math.sin(theta),
      gc.y + 24 - Math.sin(p * Math.PI) * 22,   // gentle vertical breathing mid-orbit
      gc.z + dist * Math.cos(theta)
    );
    camera.lookAt(gc.x, RIG.lookY, gc.z);       // model centre, not the globe
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
        if (p < 0.04) o = 0;               // panels appear once the hero copy clears
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
