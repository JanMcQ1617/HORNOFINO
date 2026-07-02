/* ============================================================
   Hornofino — 3D arrow journey (Three.js)
   A stylized Greek marble archer stands in the hero. As you
   scroll, he releases an arrow that follows a spline through
   [data-waypoint] elements (menu cards, foods, reviews),
   lighting each one up as it passes.

   Design notes:
   - Fixed transparent canvas overlay, pointer-events: none —
     the page stays fully interactive (input is never blocked).
   - Camera is set so 1 world unit == 1 CSS pixel at z=0.
   - Animations are transform/opacity only in DOM land; all 3D
     work stays under the 16ms frame budget (few dozen meshes).
   - Skips entirely for prefers-reduced-motion.
   ============================================================ */
import * as THREE from "three";

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.getElementById("journeyCanvas");
  var anchor = document.getElementById("statueAnchor");
  if (!canvas || !anchor) return;

  // ---------- palette ----------
  var MARBLE  = 0xf2ece1;
  var MARBLE2 = 0xe4dccd;
  var ORANGE  = 0xfc4c02;
  var BRONZE  = 0x8a5a2b;

  // ---------- renderer / scene / camera ----------
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  var DPR_CAP = window.innerWidth < 820 ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));

  var scene = new THREE.Scene();
  var FOV = 40;
  var camera = new THREE.PerspectiveCamera(FOV, 1, 1, 8000);

  function sizeCamera() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // distance so that the z=0 plane maps 1 world unit -> 1 CSS px
    camera.position.z = (h / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.updateProjectionMatrix();
  }
  sizeCamera();

  scene.add(new THREE.AmbientLight(0xfff4ea, 1.15));
  var sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(300, 500, 600);
  scene.add(sun);
  var rim = new THREE.PointLight(ORANGE, 90000, 0, 2); // warm brand rim
  rim.position.set(-200, 100, 250);
  scene.add(rim);

  // page(px,py) -> world at z=0 (viewport-centred)
  function toWorld(px, py) {
    return new THREE.Vector3(
      px - window.scrollX - window.innerWidth / 2,
      window.innerHeight / 2 - (py - window.scrollY),
      0
    );
  }

  // ---------- materials ----------
  var marbleMat = new THREE.MeshStandardMaterial({ color: MARBLE, roughness: 0.55, metalness: 0.05 });
  var marble2Mat = new THREE.MeshStandardMaterial({ color: MARBLE2, roughness: 0.65, metalness: 0.05 });
  var bronzeMat = new THREE.MeshStandardMaterial({ color: BRONZE, roughness: 0.35, metalness: 0.6 });
  var orangeMat = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.3, metalness: 0.25, emissive: ORANGE, emissiveIntensity: 0.25 });

  function mesh(geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    return m;
  }

  // ---------- the archer (stylized, from primitives) ----------
  // Local space: origin at pedestal bottom-centre, +x = shooting direction, +y = up.
  var statue = new THREE.Group();
  var HAND = new THREE.Vector3(64, 176, 0); // bow hand (local)

  (function buildStatue() {
    // pedestal: plinth + drum + cap
    statue.add(mesh(new THREE.BoxGeometry(120, 16, 90), marble2Mat, 0, 8, 0));
    statue.add(mesh(new THREE.CylinderGeometry(38, 44, 26, 24), marbleMat, 0, 29, 0));
    statue.add(mesh(new THREE.BoxGeometry(96, 10, 72), marble2Mat, 0, 47, 0));

    var fig = new THREE.Group();
    fig.position.y = 52;
    statue.add(fig);

    // legs (weight-shifted contrapposto: one straight, one eased)
    fig.add(mesh(new THREE.CylinderGeometry(7, 8.5, 62, 12), marbleMat, -12, 31, 6, 0, 0, 0.05));
    fig.add(mesh(new THREE.CylinderGeometry(7, 8.5, 60, 12), marbleMat, 12, 30, -8, 0.12, 0, -0.14));
    // hips + torso (tapered) + chest
    fig.add(mesh(new THREE.SphereGeometry(15, 16, 12), marbleMat, 0, 64, 0));
    fig.add(mesh(new THREE.CylinderGeometry(16, 13, 40, 14), marbleMat, 0, 86, 0, 0, 0, -0.06));
    fig.add(mesh(new THREE.SphereGeometry(17, 16, 12), marbleMat, 1, 106, 0));
    // draped chiton hint (flat band)
    fig.add(mesh(new THREE.TorusGeometry(16.5, 3, 8, 20, Math.PI * 1.2), marble2Mat, 0, 92, 0, 0, 0, 2.4));
    // neck + head
    fig.add(mesh(new THREE.CylinderGeometry(5.5, 6.5, 10, 10), marbleMat, 2, 122, 0));
    var head = mesh(new THREE.SphereGeometry(11, 18, 14), marbleMat, 3, 134, 0);
    head.name = "head";
    fig.add(head);
    // corinthian crest
    var crest = mesh(new THREE.TorusGeometry(11, 3.2, 8, 18, Math.PI), orangeMat, 3, 138, 0, 0, 0, 0);
    crest.rotation.y = Math.PI / 2;
    crest.rotation.z = Math.PI * 0.08;
    fig.add(crest);

    // front arm — extended, holds the bow
    fig.add(mesh(new THREE.CylinderGeometry(4.5, 5.5, 46, 10), marbleMat, 32, 112, 0, 0, 0, Math.PI / 2 - 0.22));
    fig.add(mesh(new THREE.SphereGeometry(5.5, 10, 8), marbleMat, 54, 121, 0));

    // draw arm group (shoulder pivot) — animates on release
    var drawArm = new THREE.Group();
    drawArm.position.set(-8, 108, 0);
    drawArm.name = "drawArm";
    drawArm.add(mesh(new THREE.CylinderGeometry(4.5, 5.5, 34, 10), marbleMat, 14, 6, 4, 0, 0, Math.PI / 2 - 0.5));
    drawArm.add(mesh(new THREE.SphereGeometry(5, 10, 8), marbleMat, 28, 12, 6));
    fig.add(drawArm);

    // bow (vertical arc at the hand) + string
    var bow = mesh(new THREE.TorusGeometry(46, 2.6, 8, 32, Math.PI * 1.16), bronzeMat, HAND.x, HAND.y - 52, 0);
    bow.rotation.z = Math.PI / 2 - Math.PI * 0.08;
    statue.add(bow);

    var stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(HAND.x + 8, HAND.y + 40, 0),
      new THREE.Vector3(HAND.x - 4, HAND.y - 52, 0),
      new THREE.Vector3(HAND.x + 8, HAND.y - 144, 0)
    ]);
    var string = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0x3a2c1c }));
    string.name = "string";
    statue.add(string);
  })();
  scene.add(statue);

  // ---------- the arrow ----------
  var arrow = new THREE.Group();
  (function buildArrow() {
    arrow.add(mesh(new THREE.CylinderGeometry(2, 2, 52, 8), bronzeMat, 0, 0, 0, 0, 0, Math.PI / 2)); // shaft (+x)
    arrow.add(mesh(new THREE.ConeGeometry(4.5, 14, 10), orangeMat, 33, 0, 0, 0, 0, -Math.PI / 2));   // head
    var f = new THREE.PlaneGeometry(12, 8);
    var fm = new THREE.MeshStandardMaterial({ color: ORANGE, side: THREE.DoubleSide, roughness: 0.5 });
    arrow.add(mesh(f, fm, -24, 4, 0, 0, 0, 0.5));
    arrow.add(mesh(f, fm, -24, -4, 0, 0, 0, -0.5));
    arrow.add(mesh(f, fm, -24, 0, 4, 0.9, 0, 0.4));
  })();
  scene.add(arrow);

  // glowing trail (short history of arrow positions)
  var TRAIL_N = 26;
  var trailPos = new Float32Array(TRAIL_N * 3);
  var trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  var trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
    color: ORANGE, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending
  }));
  scene.add(trail);
  var trailPts = [];

  // ---------- waypoints / spline (page coordinates) ----------
  var wpEls = [];
  var wpPage = [];   // Vector2 page-centres
  var wpHit = [];
  var wpT = [];      // arc-length t of each waypoint along the curve
  var curve = null;

  function measure() {
    wpEls = Array.prototype.slice.call(document.querySelectorAll("[data-waypoint]"));
    wpPage = wpEls.map(function (el) {
      var r = el.getBoundingClientRect();
      return new THREE.Vector2(r.left + window.scrollX + r.width / 2, r.top + window.scrollY + r.height / 2);
    });
    // preserve hit state across lazy re-measures (only the loop resets it, pre-release)
    if (wpHit.length !== wpEls.length) wpHit = wpEls.map(function () { return false; });

    var a = anchor.getBoundingClientRect();
    var s = statueScale();
    var start = new THREE.Vector2(
      a.left + window.scrollX + a.width * 0.5 + HAND.x * s,
      a.top + window.scrollY + a.height - HAND.y * s
    );
    var pts = [new THREE.Vector3(start.x, start.y, 0),
               new THREE.Vector3(start.x + 180, start.y - 60, 0)]; // rising launch
    wpPage.forEach(function (p) { pts.push(new THREE.Vector3(p.x, p.y, 0)); });
    curve = pts.length >= 2 ? new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4) : null;

    // map each waypoint to its arc-length parameter (getPointAt is arc-length based)
    wpT = [];
    if (curve) {
      var SAMPLES = 240;
      var sampled = curve.getSpacedPoints(SAMPLES);
      wpPage.forEach(function (p) {
        var best = 0, bestD = Infinity;
        for (var i = 0; i <= SAMPLES; i++) {
          var dx = sampled[i].x - p.x, dy = sampled[i].y - p.y;
          var d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
        wpT.push(best / SAMPLES);
      });
    }
  }

  function statueScale() {
    return window.innerWidth < 820 ? 0.62 : Math.min(1, window.innerWidth / 1400 + 0.3);
  }

  // ---------- waypoint chip labels ----------
  function chip(el, text) {
    var r = el.getBoundingClientRect();
    var d = document.createElement("div");
    d.className = "journey-chip";
    d.textContent = text;
    d.style.left = (r.left + r.width / 2) + "px";
    d.style.top = (r.top - 10) + "px";
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add("show"); });
    setTimeout(function () { d.classList.remove("show"); }, 1400);
    setTimeout(function () { d.remove(); }, 1900);
  }

  function hitWaypoint(i) {
    if (wpHit[i]) return;
    wpHit[i] = true;
    var el = wpEls[i];
    el.classList.add("wp-hit");
    setTimeout(function () { el.classList.remove("wp-hit"); }, 1300);
    var label = el.getAttribute("data-waypoint");
    if (label) chip(el, label);
    rim.position.copy(toWorld(wpPage[i].x, wpPage[i].y)).setZ(120);
  }

  // ---------- scroll state ----------
  var released = false;
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  var RELEASE_AT = 0.02;

  // ---------- auto tour ----------
  var touring = false;
  function tour() {
    if (touring) return;
    touring = true;
    var startY = window.scrollY;
    var endY = document.documentElement.scrollHeight - window.innerHeight;
    var dur = Math.min(14000, Math.max(6000, (endY - startY) * 1.6));
    var t0 = performance.now();
    function cancel() { touring = false; }
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("touchstart", cancel, { once: true, passive: true });
    (function step(now) {
      if (!touring) return;
      var t = Math.min(1, (now - t0) / dur);
      var e = 0.5 - 0.5 * Math.cos(Math.PI * t); // easeInOutSine
      window.scrollTo(0, startY + (endY - startY) * e);
      if (t < 1) requestAnimationFrame(step);
      else touring = false;
    })(t0);
  }
  var tourBtn = document.getElementById("journeyTour");
  if (tourBtn) tourBtn.addEventListener("click", tour);

  // statue click via raycast (canvas has pointer-events: none, so listen on document)
  var ray = new THREE.Raycaster();
  var ndc = new THREE.Vector2();
  document.addEventListener("click", function (e) {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(statue, true).length) tour();
  });

  // gentle head-tracking toward the cursor
  var cursor = new THREE.Vector2(0, 0);
  document.addEventListener("pointermove", function (e) {
    cursor.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  // ---------- re-measure on layout changes ----------
  window.addEventListener("resize", function () { sizeCamera(); measure(); });
  window.addEventListener("load", measure);
  measure();
  setInterval(measure, 2500); // lazy safety net for late layout shifts (images/fonts)

  // ---------- animation loop ----------
  var drawArm = statue.getObjectByName("drawArm");
  var string = statue.getObjectByName("string");
  var head = statue.getObjectByName("head");
  var releasePop = 0;

  function updateString(draw) {
    // draw: 0 (slack) -> 1 (full draw); after release it snaps back
    var p = string.geometry.attributes.position;
    p.setX(1, HAND.x - 4 - draw * 26);
    p.needsUpdate = true;
  }

  function animate(now) {
    var t = now * 0.001;
    var p = progress();
    var s = statueScale();

    // -- statue anchored to the hero (page coords -> world)
    var a = anchor.getBoundingClientRect();
    var basePage = { x: a.left + window.scrollX + a.width * 0.5, y: a.top + window.scrollY + a.height };
    var w = toWorld(basePage.x, basePage.y);
    statue.position.set(w.x, w.y, 0);
    statue.scale.setScalar(s);
    statue.rotation.y = Math.sin(t * 0.4) * 0.06 + cursor.x * 0.18; // idle sway + cursor
    if (head) head.rotation.y = cursor.x * 0.5, head.rotation.x = cursor.y * 0.3;

    // -- bow draw before release, snap after
    if (p < RELEASE_AT) {
      released = false;
      wpHit = wpHit.map(function () { return false; });
      var draw = p / RELEASE_AT;
      if (drawArm) drawArm.position.x = -8 - draw * 14;
      updateString(draw * 0.9 + 0.05);
      releasePop = 1;
    } else {
      if (!released) { released = true; }
      if (releasePop > 0) { releasePop = Math.max(0, releasePop - 0.08); }
      if (drawArm) drawArm.position.x = -8 - releasePop * 14;
      updateString(releasePop * 0.9);
    }

    // -- arrow
    if (curve) {
      if (!released) {
        // nocked on the string, riding the draw
        var draw2 = Math.min(1, p / RELEASE_AT);
        var nock = new THREE.Vector3(HAND.x - draw2 * 26 - 20, HAND.y - 52, 6)
          .multiplyScalar(s)
          .add(new THREE.Vector3(statue.position.x, statue.position.y, 0));
        arrow.position.copy(nock);
        arrow.rotation.set(0, 0, 0.06);
        arrow.scale.setScalar(s);
        arrow.visible = a.bottom > -100; // hide once hero long gone
        trailPts.length = 0;
      } else {
        var tt = Math.min(1, (p - RELEASE_AT) / (1 - RELEASE_AT));
        var pos = curve.getPointAt(tt);
        var tan = curve.getTangentAt(Math.min(0.999, tt));
        var wpos = toWorld(pos.x, pos.y);
        arrow.visible = wpos.y > -window.innerHeight && wpos.y < window.innerHeight;
        arrow.position.copy(wpos);
        arrow.rotation.z = Math.atan2(-tan.y, tan.x);
        arrow.scale.setScalar(0.9);

        // trail
        trailPts.push(wpos.clone());
        if (trailPts.length > TRAIL_N) trailPts.shift();
        for (var i = 0; i < TRAIL_N; i++) {
          var v = trailPts[Math.max(0, trailPts.length - TRAIL_N + i)] || wpos;
          trailPos[i * 3] = v.x; trailPos[i * 3 + 1] = v.y; trailPos[i * 3 + 2] = v.z;
        }
        trailGeo.attributes.position.needsUpdate = true;

        // waypoint hits at their true arc-length positions
        for (var k = 0; k < wpT.length; k++) {
          if (tt >= wpT[k] - 0.008) hitWaypoint(k);
        }
      }
    }
    trail.visible = released && arrow.visible;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
