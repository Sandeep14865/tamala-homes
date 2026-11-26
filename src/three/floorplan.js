// Project pages: 2 BHK and 3 BHK plans, extruded into a cut-away 3D model, with a flat layout view.
// One unit is one foot. The room list beside it (HTML) carries the areas.
import { createViewer, addLights } from './viewer.js';
import { PLANS } from '../data.js';

const WALL_H = 3.2, WALL_T = 0.45;

export function mountPlan(frame) {
  const v = createViewer(frame, { radius: 92, yaw: 0.55, pitch: 0.78, minPitch: 0.35, maxPitch: 1.25, fov: 30 });
  const { THREE, scene } = v;
  addLights(scene);
  const base = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshLambertMaterial({ color: 0x16302a }));
  base.rotation.x = -Math.PI / 2; base.position.y = -0.05; scene.add(base);

  const wallMat = new THREE.MeshLambertMaterial({ color: 0xfaf7f0 });
  const capMat = new THREE.MeshLambertMaterial({ color: 0x0f231d });   // wall tops drawn dark, like the lines of a plan
  const furnMat = new THREE.MeshLambertMaterial({ color: 0xbcae92 });
  const softMat = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
  let group = null, floors = new Map(), current = null, hl = null;

  const layer = document.createElement('div');
  layer.className = 'viz__labels'; layer.setAttribute('aria-hidden', 'true'); frame.appendChild(layer);
  let tags = [];
  v.afterRender(() => tags.forEach(({ el, pos }) => {
    const p = v.project(pos); el.style.transform = p ? `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)` : 'translate(-999px,-999px)';
  }));

  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); group.add(m); return m;
  }

  function build(bhk) {
    if (group) { scene.remove(group); group.traverse(o => o.geometry && o.geometry.dispose()); }
    group = new THREE.Group(); floors = new Map(); current = bhk; hl = null;
    layer.textContent = ''; tags = [];
    const plan = PLANS[bhk];
    const ox = -plan.w / 2, oz = -plan.d / 2;
    for (const r of plan.rooms) {
      const mat = new THREE.MeshLambertMaterial({ color: r.tone });
      const fl = box(r.w - 0.1, 0.3, r.d - 0.1, mat, ox + r.x + r.w / 2, 0.15, oz + r.y + r.d / 2);
      fl.userData = { room: r.id, tone: r.tone };
      floors.set(r.id, fl); v.pickables.push(fl);
      // walls on the room's four edges (shared edges overlap, which reads as one wall); the balcony gets a low rail
      const h = r.id === 'balcony' ? 1.1 : WALL_H;
      const edges = [
        [r.w, WALL_T, r.x + r.w / 2, r.y], [r.w, WALL_T, r.x + r.w / 2, r.y + r.d],
        [WALL_T, r.d, r.x, r.y + r.d / 2], [WALL_T, r.d, r.x + r.w, r.y + r.d / 2],
      ];
      for (const [w, d, cx, cz] of edges) {
        box(w, h, d, wallMat, ox + cx, 0.3 + h / 2, oz + cz);
        box(w, 0.06, d, capMat, ox + cx, 0.3 + h + 0.03, oz + cz);   // a dark cap draws the cut line
      }
      for (const it of r.items) {
        const cx = ox + it.x + it.w / 2, cz = oz + it.y + it.d / 2;
        if (it.t === 'bed') { box(it.w, 1.2, it.d, softMat, cx, 0.9, cz); box(it.w, 0.5, 1.2, furnMat, cx, 1.75, oz + it.y + 0.6); }
        else if (it.t === 'sofa') { box(it.w, 1.3, it.d, furnMat, cx, 0.95, cz); }
        else if (it.t === 'table') { box(it.w, 1.6, it.d, softMat, cx, 1.1, cz); }
        else if (it.t === 'counter') { box(it.w, 2.6, it.d, furnMat, cx, 1.6, cz); }
      }
      const el = document.createElement('span'); el.className = 'viz__label viz__label--room'; el.textContent = r.name;
      layer.appendChild(el); tags.push({ el, pos: new THREE.Vector3(ox + r.x + r.w / 2, WALL_H + 1, oz + r.y + r.d / 2), id: r.id });
    }
    scene.add(group);
    v.pickables.length = 0; floors.forEach(f => v.pickables.push(f));
    v.state.radius = bhk === 3 ? 106 : 92;
    v.setOrthoSize(bhk === 3 ? 25 : 21);
    v.invalidate();
  }

  function highlight(id) {
    if (hl) { const f = floors.get(hl); if (f) f.material.color.set(f.userData.tone); }
    hl = id;
    const f = id && floors.get(id);
    if (f) f.material.color.set(0xe0a526);
    tags.forEach(t => t.el.classList.toggle('is-on', t.id === id));
    v.invalidate();
  }

  build(3);
  return {
    show(bhk) { if (bhk !== current) build(bhk); },
    highlight,
    setView(view) { v.setOrtho(view === 'layout'); },
    turn: d => v.turn(d),
    dispose() { layer.remove(); v.dispose(); },
    set onPick(fn) { v.onPick = o => fn(o ? o.userData.room : null); },
  };
}
