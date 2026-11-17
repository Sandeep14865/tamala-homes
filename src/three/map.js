// Home page: a tilted 3D map of Guntur with the three projects and the places people drive to.
// The panel beside it (plain HTML) works without WebGL; the map only adds to it.
import { createViewer, addLights } from './viewer.js';
import { MAP } from '../data.js';

const C = { ground: 0x16302a, block: 0x2f5647, block2: 0x3a6353, road: 0x4a7163, nh: 0x5c8575, rail: 0x9fb0a6, pin: 0xeef0e8, project: 0xe0a526, sel: 0x4a82d6 };

export function mountMap(frame, panel) {
  const v = createViewer(frame, { radius: 50, yaw: 0.35, pitch: 0.86, minPitch: 0.45, maxPitch: 1.2, fov: 30 });
  const { THREE, scene } = v;
  v.state.target.set(2, 0, -6);
  addLights(scene);

  // ground
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshLambertMaterial({ color: C.ground }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // roads as flat ribbons
  const roadMat = new THREE.MeshLambertMaterial({ color: C.road });
  const nhMat = new THREE.MeshLambertMaterial({ color: C.nh });
  const railMat = new THREE.MeshLambertMaterial({ color: C.rail });
  const roadSegs = [];
  for (const r of MAP.roads) {
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [x1, z1] = r.pts[i], [x2, z2] = r.pts[i + 1];
      const len = Math.hypot(x2 - x1, z2 - z1);
      const w = r.rail ? 0.18 : r.name === 'NH-16' ? 1.0 : 0.7;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(len + w, r.rail ? 0.06 : 0.04, w), r.rail ? railMat : r.name === 'NH-16' ? nhMat : roadMat);
      seg.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2);
      seg.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      scene.add(seg);
      roadSegs.push({ x1, z1, x2, z2, w });
    }
  }
  const nearRoad = (x, z) => roadSegs.some(({ x1, z1, x2, z2, w }) => {
    const dx = x2 - x1, dz = z2 - z1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - (x1 + t * dx), z - (z1 + t * dz)) < w + 0.9;
  });

  // city blocks: denser near the old town, thinning to the north
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const blocks = new THREE.Group();
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const m1 = new THREE.MeshLambertMaterial({ color: C.block }), m2 = new THREE.MeshLambertMaterial({ color: C.block2 });
  for (let i = 0; i < 520; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.7) * 26;
    const x = Math.cos(a) * d + 2, z = Math.sin(a) * d * 0.9 + 2;
    if (Math.hypot(x, z) > 28 || nearRoad(x, z)) continue;
    if (MAP.projects.some(p => Math.hypot(p.x - x, p.z - z) < 2.2)) continue;
    const core = Math.max(0, 1 - Math.hypot(x - 1, z - 3) / 20);
    const h = 0.25 + rnd() * (0.5 + core * 1.6);
    const b = new THREE.Mesh(geo, rnd() > 0.5 ? m1 : m2);
    const w = 0.6 + rnd() * 0.9, dd = 0.6 + rnd() * 0.9;
    b.scale.set(w, h, dd); b.position.set(x, h / 2, z); b.rotation.y = rnd() * 0.3;
    blocks.add(b);
  }
  scene.add(blocks);

  // pins: landmarks short and dark, projects tall in brass
  const pinMat = new THREE.MeshLambertMaterial({ color: C.pin });
  const projMat = new THREE.MeshLambertMaterial({ color: C.project });
  const selMat = new THREE.MeshLambertMaterial({ color: C.sel });
  const labels = [];
  function pin(x, z, h, mat, r) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 8), mat);
    stem.position.y = h / 2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    head.position.y = h;
    g.add(stem, head); g.position.set(x, 0, z);
    scene.add(g);
    return { g, head, stem };
  }
  const projPins = MAP.projects.map(p => {
    const o = pin(p.x, p.z, 5.2, projMat, 0.55);
    // a slim tower under the pin so the project reads as a building
    const tw = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.6, 1.3), projMat);
    tw.position.set(p.x, 1.3, p.z); scene.add(tw);
    o.head.userData = { project: p.key }; tw.userData = { project: p.key };
    v.pickables.push(o.head, tw);
    return { ...o, tw, p };
  });
  const lmPins = MAP.landmarks.map(l => ({ ...pin(l.x, l.z, 2.2, pinMat, 0.32), l }));

  // HTML labels that follow the pins
  const layer = document.createElement('div');
  layer.className = 'viz__labels';
  layer.setAttribute('aria-hidden', 'true');
  frame.appendChild(layer);
  const mk = (text, cls, y, obj) => {
    const el = document.createElement('span'); el.className = `viz__label ${cls}`; el.textContent = text;
    layer.appendChild(el); labels.push({ el, pos: new THREE.Vector3(obj.x, y, obj.z) }); return el;
  };
  projPins.forEach(pp => { pp.label = mk(pp.p.name.replace('Tamala ', ''), 'viz__label--project', 6.3, pp.p); });
  // each landmark's chip carries its name and, once a project is chosen, the drive time from it
  lmPins.forEach(lp => {
    lp.label = mk('', 'viz__label--place', 3.1, lp.l);
    lp.name = document.createElement('span'); lp.name.textContent = lp.l.name;
    lp.time = document.createElement('b');
    lp.label.append(lp.name, lp.time);
  });
  v.afterRender(() => {
    for (const { el, pos } of labels) {
      const p = v.project(pos);
      if (!p) { el.style.transform = 'translate(-999px,-999px)'; continue; }
      const half = el.offsetWidth / 2 + 8, W = frame.clientWidth;
      el.style.transform = `translate(${Math.min(W - half, Math.max(half, p.x))}px, ${p.y}px) translate(-50%, -100%)`;
    }
  });

  // selection: tie the 3D pins to the panel's project buttons
  // thin ribbons on the ground from the chosen project to every landmark: what the drive times measure
  const routeMat = new THREE.MeshLambertMaterial({ color: 0xe0a526 });
  const routeHot = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const routes = lmPins.map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.14), routeMat); m.visible = false; scene.add(m); return m; });
  let current = null, hot = -1;
  function highlight(i) {
    hot = i;
    lmPins.forEach((lp, k) => { lp.label.classList.toggle('is-on', k === i); routes[k].material = k === i ? routeHot : routeMat; routes[k].scale.z = k === i ? 2 : 1; });
    v.invalidate();
  }
  function select(key) {
    current = key;
    const from = MAP.projects.find(p => p.key === key);
    lmPins.forEach((lp, k) => {
      lp.time.textContent = `${lp.l.min[key]} min`;
      const dx = lp.l.x - from.x, dz = lp.l.z - from.z, len = Math.hypot(dx, dz), r = routes[k];
      r.visible = true; r.scale.x = len; r.position.set((from.x + lp.l.x) / 2, 0.09, (from.z + lp.l.z) / 2); r.rotation.y = -Math.atan2(dz, dx);
    });
    projPins.forEach(pp => {
      const on = pp.p.key === key;
      pp.head.material = pp.tw.material = on ? selMat : projMat;
      pp.label.classList.toggle('is-on', on);
    });
    v.invalidate();
  }
  v.onPick = o => { if (o && o.userData.project) panel.select(o.userData.project, true); };
  v.onHover = o => { if (o && o.userData.project && o.userData.project !== current) panel.select(o.userData.project, false); };

  return { select, highlight, turn: d => v.turn(d), dispose() { layer.remove(); v.dispose(); } };
}
