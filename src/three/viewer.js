// One WebGL view: renderer, camera, resize, a turntable the visitor drags, picking, and pausing.
// Each page keeps at most two of these alive (the taste kit allows four contexts).
// Named imports only, so the bundle carries just these parts of three.js.
import {
  WebGLRenderer, SRGBColorSpace, NoToneMapping, Scene, Color, PerspectiveCamera, OrthographicCamera, Vector3, Vector2,
  Raycaster, HemisphereLight, DirectionalLight, Mesh, Group, CircleGeometry, BoxGeometry, CylinderGeometry, SphereGeometry,
  ConeGeometry, PlaneGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, MeshLambertMaterial,
} from 'three';

const THREE = {
  WebGLRenderer, SRGBColorSpace, NoToneMapping, Scene, Color, PerspectiveCamera, OrthographicCamera, Vector3, Vector2,
  Raycaster, HemisphereLight, DirectionalLight, Mesh, Group, CircleGeometry, BoxGeometry, CylinderGeometry, SphereGeometry,
  ConeGeometry, PlaneGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, MeshLambertMaterial,
};

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createViewer(frame, {
  fov = 32, target = new THREE.Vector3(0, 0, 0), radius = 40, yaw = 0.7, pitch = 0.55,
  minPitch = 0.15, maxPitch = 1.35, ortho = false, background = null,
} = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  // phones get a lower ceiling: sharp enough, and far cheaper to fill
  const dprCap = window.matchMedia('(max-width: 639px)').matches ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const canvas = renderer.domElement;
  const ac = new AbortController(), sig = { signal: ac.signal };   // every listener leaves with dispose()
  // a GPU that rejects a shader leaves the canvas empty: hide it and keep the poster
  let failed = false;
  renderer.debug.onShaderError = () => { failed = true; frame.removeAttribute('data-live'); canvas.style.display = 'none'; };
  canvas.className = 'viz__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  frame.appendChild(canvas);

  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);

  const persp = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);
  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  let camera = ortho ? orthoCam : persp;

  const state = { yaw, pitch, radius, target: target.clone(), orthoSize: radius * 0.42 };
  const goal = { yaw, pitch };

  function place() {
    const { yaw: y, pitch: p, radius: r, target: t } = state;
    const pos = new THREE.Vector3(
      t.x + r * Math.cos(p) * Math.sin(y),
      t.y + r * Math.sin(p),
      t.z + r * Math.cos(p) * Math.cos(y),
    );
    persp.position.copy(pos); persp.lookAt(t);
    orthoCam.position.set(t.x, t.y + 100, t.z + 0.0001); orthoCam.up.set(0, 0, -1); orthoCam.lookAt(t);
  }

  function size() {
    const w = frame.clientWidth, h = frame.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    persp.aspect = w / h; persp.updateProjectionMatrix();
    const s = state.orthoSize, a = w / h;
    Object.assign(orthoCam, a >= 1 ? { left: -s * a, right: s * a, top: s, bottom: -s } : { left: -s, right: s, top: s / a, bottom: -s / a });
    orthoCam.updateProjectionMatrix();
    dirty = true; wake();
  }

  // ---- drag to turn (Apple's fluid-interface rules): the model stays glued to the pointer, a flick carries
  //      on with its own momentum, the tilt limits give softly, and a moving model can be caught mid-turn ----
  let drag = null, moved = false;
  const KY = 0.008, KP = 0.006;
  const rubber = (over, dim = 0.6, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
  const project = (v, d = 0.992) => (v / 1000) * d / (1 - d);        // where a release at v px/s comes to rest
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', e => {
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    goal.yaw = state.yaw; goal.pitch = state.pitch;                   // caught mid-flight: start from what is on screen
    drag = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch, hist: [[e.clientX, e.clientY, performance.now()]] };
    moved = false;
  }, sig);
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    if (camera === orthoCam) return;
    drag.hist.push([e.clientX, e.clientY, performance.now()]); if (drag.hist.length > 6) drag.hist.shift();
    state.yaw = goal.yaw = drag.yaw - dx * KY;                        // 1:1, no easing while the pointer is down
    if (e.pointerType === 'mouse') {
      let p = drag.pitch + dy * KP;
      if (p > maxPitch) p = maxPitch + rubber(p - maxPitch); else if (p < minPitch) p = minPitch + rubber(p - minPitch);
      state.pitch = goal.pitch = p;
    }
    dirty = true; wake();
  }, sig);
  const release = () => {
    if (!drag) return;
    const h = drag.hist, a = h[0], b = h[h.length - 1], dt = b[2] - a[2];
    if (camera !== orthoCam && dt > 0 && performance.now() - b[2] < 90) {
      goal.yaw = state.yaw - project((b[0] - a[0]) / dt * 1000) * KY; // hand the release velocity to the settle
    }
    goal.pitch = Math.min(maxPitch, Math.max(minPitch, state.pitch)); // spring back from the soft limit
    drag = null; dirty = true; wake();
  };
  window.addEventListener('pointerup', release, sig);
  window.addEventListener('pointercancel', release, sig);

  // ---- picking ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickables = [];
  let onPick = null, onHover = null, hovered = null;
  function hit(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables, false)[0];
    return h ? h.object : null;
  }
  canvas.addEventListener('click', e => { if (!moved && onPick) onPick(hit(e)); }, sig);
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || drag || !onHover) return;
    const o = hit(e);
    if (o !== hovered) { hovered = o; onHover(o); canvas.style.cursor = o ? 'pointer' : 'grab'; dirty = true; wake(); }
  }, sig);
  canvas.addEventListener('pointerleave', () => { if (onHover && hovered) { hovered = null; onHover(null); dirty = true; wake(); } }, sig);

  // ---- run only while on screen and the tab is visible ----
  let visible = false, dirty = true, raf = 0, firstFrame = false;
  const ticks = [], after = [];
  function frameLoop() {
    raf = 0;
    if (!visible || document.hidden) return;
    const k = reduceMotion() ? 1 : 0.14;
    const settling = Math.abs(goal.yaw - state.yaw) > 0.0005 || Math.abs(goal.pitch - state.pitch) > 0.0005;
    state.yaw += (goal.yaw - state.yaw) * k;
    state.pitch += (goal.pitch - state.pitch) * k;
    let anim = false;
    for (const t of ticks) anim = t() || anim;
    if (settling || dirty || anim) {
      place(); renderer.render(scene, camera); dirty = false;
      if (!firstFrame && !failed) { firstFrame = true; frame.setAttribute('data-live', ''); }   // an attribute, not a class: React owns the class list
      for (const f of after) f(camera);
    }
    // sleep when nothing moves; any input or change wakes the loop again
    if (settling || anim) raf = requestAnimationFrame(frameLoop);
  }
  const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frameLoop); };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake(); }, { rootMargin: '100px' });
  io.observe(frame);
  document.addEventListener('visibilitychange', wake, sig);
  const ro = new ResizeObserver(size);
  ro.observe(frame);
  size(); place();

  // dev only: render a still of this view for its poster (vite.config.js saves it)
  if (import.meta.env.DEV) {
    (window.__views ||= []).push({
      frame,
      snap() { place(); renderer.render(scene, camera); for (const f of after) f(camera); return canvas.toDataURL('image/webp', 0.82); },
    });
  }

  return {
    THREE, scene, renderer, canvas, state, goal,
    get camera() { return camera; },
    pickables,
    set onPick(fn) { onPick = fn; },
    set onHover(fn) { onHover = fn; },
    addTick(fn) { ticks.push(fn); wake(); },
    afterRender(fn) { after.push(fn); },
    // screen position of a world point, in px inside the frame (null when behind the camera)
    project(v) {
      const p = v.clone().project(camera);
      if (p.z > 1) return null;
      return { x: (p.x + 1) / 2 * frame.clientWidth, y: (1 - p.y) / 2 * frame.clientHeight };
    },
    turn(delta) { goal.yaw += delta; dirty = true; wake(); },
    setOrtho(on) { camera = on ? orthoCam : persp; canvas.style.cursor = on ? 'default' : 'grab'; dirty = true; wake(); },
    setOrthoSize(s) { state.orthoSize = s; size(); },
    invalidate() { dirty = true; wake(); },
    // React unmounts a view on every route change: free the GPU context, observers and listeners
    dispose() {
      visible = false; cancelAnimationFrame(raf); ac.abort(); io.disconnect(); ro.disconnect();
      scene.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); });
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); frame.removeAttribute('data-live');
      if (window.__views) window.__views = window.__views.filter(x => x.frame !== frame);
    },
  };
}

// Soft daylight shared by every scene.
export function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a8a78, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(30, 50, 20);
  scene.add(sun);
  return sun;
}
