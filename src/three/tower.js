// Project pages: the towers in 3D, one block per flat, coloured by status.
// The HTML panel (selects, legend, details) is the real interface; this view mirrors it.
import { createViewer, addLights } from './viewer.js';
import { STATUS } from '../data.js';

const FLOOR_H = 1.12, UNIT_H = 0.96, GAP = 14;
// unit centres around the core: A, B face west; C, D face east
const SLOT = { A: [-2.12, -2.3], B: [-2.12, 2.3], C: [2.12, -2.3], D: [2.12, 2.3] };

export function mountTower(frame, flats, { towers, floors }) {
  const height = (floors + 1) * FLOOR_H;
  const span = (towers.length - 1) * GAP;
  const v = createViewer(frame, { radius: Math.max(40, height * 2.5 + span * 1.15 + 8), yaw: 0.62, pitch: 0.3, minPitch: 0.08, maxPitch: 0.95, fov: 30 });
  const { THREE, scene } = v;
  v.state.target.set(0, height * 0.5, 0);
  addLights(scene);

  // ground, lawn and a few trees
  const ground = new THREE.Mesh(new THREE.CircleGeometry(span / 2 + 22, 64), new THREE.MeshLambertMaterial({ color: 0x16302a }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(span + 18, 16), new THREE.MeshLambertMaterial({ color: 0x1f4034 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.01; scene.add(lawn);
  const treeMat = new THREE.MeshLambertMaterial({ color: 0x2f6a4c }), trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a4a40 });
  for (let i = 0; i < 14; i++) {
    const x = -span / 2 - 7 + (i % 7) * ((span + 14) / 6), z = i < 7 ? -6.6 : 6.6;
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 7), treeMat); t.position.set(x, 1.9, z);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), trunkMat); tr.position.set(x, 0.4, z);
    scene.add(t, tr);
  }

  const slabMat = new THREE.MeshLambertMaterial({ color: 0xe6eae0 });
  const coreMat = new THREE.MeshLambertMaterial({ color: 0xb4beb2 });
  const mats = Object.fromEntries(Object.entries(STATUS).map(([k, s]) => [k, new THREE.MeshLambertMaterial({ color: s.color })]));
  // every flat stands dark; only the chosen one takes its status colour. Flats outside the 2 or 3 BHK filter sink further back.
  const dark = new THREE.MeshLambertMaterial({ color: 0x35554a });
  const faded = new THREE.MeshLambertMaterial({ color: 0x1c342c, transparent: true, opacity: 0.55 });
  const unitGeo = new THREE.BoxGeometry(4.1, UNIT_H, 4.45);
  const edgeGeo = new THREE.EdgesGeometry(unitGeo);
  const selEdge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
  selEdge.scale.setScalar(1.03); selEdge.visible = false; scene.add(selEdge);

  const meshById = new Map();
  towers.forEach((name, ti) => {
    const ox = ti * GAP - span / 2;
    // stilt floor: columns for parking
    for (const [cx, cz] of [[-4, -4.5], [4, -4.5], [-4, 4.5], [4, 4.5], [0, -4.5], [0, 4.5]]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.4, FLOOR_H, 0.4), slabMat);
      col.position.set(ox + cx, FLOOR_H / 2, cz); scene.add(col);
    }
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.2, height, 2.2), coreMat);
    core.position.set(ox, height / 2, 0); scene.add(core);
    for (let f = 1; f <= floors + 1; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.12, 9.6), slabMat);
      slab.position.set(ox, f * FLOOR_H, 0); scene.add(slab);
    }
    // a roof cabin over the core
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), slabMat);
    cabin.position.set(ox, height + 0.6, 0); scene.add(cabin);
  });
  for (const fl of flats) {
    const ox = fl.towerIndex * GAP - span / 2;
    const [sx, sz] = SLOT[fl.unit];
    const m = new THREE.Mesh(unitGeo, dark);
    m.position.set(ox + sx, fl.floor * FLOOR_H + 0.06 + UNIT_H / 2, sz);
    m.userData = { id: fl.id };
    scene.add(m); v.pickables.push(m); meshById.set(fl.id, m);
  }

  // tower letters floating over each roof
  const layer = document.createElement('div');
  layer.className = 'viz__labels'; layer.setAttribute('aria-hidden', 'true'); frame.appendChild(layer);
  const tags = towers.map((name, ti) => {
    const el = document.createElement('span'); el.className = 'viz__label viz__label--project'; el.textContent = `Tower ${name}`;
    layer.appendChild(el);
    return { el, pos: new THREE.Vector3(ti * GAP - span / 2, height + 2.2, 0) };
  });
  v.afterRender(() => tags.forEach(({ el, pos }) => {
    const p = v.project(pos);
    if (!p) { el.style.transform = 'translate(-999px,-999px)'; return; }
    const half = el.offsetWidth / 2 + 8, W = frame.clientWidth;
    el.style.transform = `translate(${Math.min(W - half, Math.max(half, p.x))}px, ${p.y}px) translate(-50%, -100%)`;
  }));

  let filter = 'all', selected = null;
  // the point the camera looks at glides to the chosen flat's tower
  let aimX = 0;
  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  v.addTick(() => {
    const t = v.state.target, dx = aimX - t.x;
    if (Math.abs(dx) < 0.01) { t.x = aimX; return false; }
    t.x += still() ? dx : dx * 0.12;
    return true;
  });
  const byId = new Map(flats.map(f => [f.id, f]));

  // the callout on the chosen flat: a short line that leaves at 45 degrees, runs level, and ends in a disc
  // in the status colour with the status written in it. It follows the flat as the tower turns.
  const NS = 'http://www.w3.org/2000/svg';
  const lead = document.createElementNS(NS, 'svg'); lead.setAttribute('class', 'viz__lead');
  const line = document.createElementNS(NS, 'polyline'); line.setAttribute('pathLength', '1');
  const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '4');
  lead.append(line, dot);
  const badge = document.createElement('span'); badge.className = 'viz__badge';
  layer.append(lead, badge);
  lead.style.display = badge.style.display = 'none';
  v.afterRender(() => {
    const m = selected && meshById.get(selected);
    const p = m && v.project(m.position);
    if (!p) { lead.style.display = badge.style.display = 'none'; return; }
    lead.style.display = badge.style.display = '';
    const W = frame.clientWidth, R = 37, D = 42, H = 30;
    const sx = p.x + D + H + 2 * R + 12 > W ? -1 : 1;                 // near the right edge it leaves to the left
    const sy = p.y - D - R < 12 ? 1 : -1;                             // near the top it leaves downward
    const ex = p.x + sx * D, ey = p.y + sy * D, hx = ex + sx * H;
    line.setAttribute('points', `${p.x},${p.y} ${ex},${ey} ${hx},${ey}`);
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    badge.style.transform = `translate(${hx + sx * R}px, ${ey}px) translate(-50%, -50%)`;
  });
  function callout(f) {
    const st = STATUS[f.status];
    badge.textContent = st.label;
    badge.style.background = st.color;
    badge.style.color = f.status === 'sold' ? '#fff' : '#0f231d';
    // replay the pop each time another flat is chosen
    for (const el of [lead, badge]) { el.classList.remove('is-pop'); void el.getBoundingClientRect(); el.classList.add('is-pop'); }
  }
  function paint() {
    for (const [id, m] of meshById) {
      const f = byId.get(id);
      m.material = id === selected ? mats[f.status] : filter === 'all' || String(f.bhk) === filter ? dark : faded;
    }
    v.invalidate();
  }
  function select(id) {
    selected = id; paint();
    if (byId.has(id)) callout(byId.get(id));
    const m = meshById.get(id);
    selEdge.visible = !!m;
    if (m) {
      selEdge.position.copy(m.position);
      // face the flat's own corner of the tower (each flat has two outside walls, east or west and front or back),
      // the short way round, and bring its tower to the middle of the view
      const f = byId.get(id);
      const [sx, sz] = SLOT[f.unit];
      const want = Math.atan2(sx, sz);
      let d = want - v.goal.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) > 0.05) v.turn(d);
      aimX = f.towerIndex * GAP - span / 2;
      v.invalidate();
    }
    v.invalidate();
  }
  return {
    setFilter(f) { filter = f; paint(); },
    select,
    turn: d => v.turn(d),
    dispose() { layer.remove(); v.dispose(); },
    set onPick(fn) { v.onPick = o => o && fn(o.userData.id); },
  };
}
