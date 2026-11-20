// The drive-time dial: the chosen project at the centre, a ring every 5 minutes by car, and each landmark placed
// in its real direction from the project at the distance of its drive time. Picking another project glides
// every place to where it sits from there. Pure SVG + HTML labels, no WebGL.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAP } from './data.js';
import { PAGES } from './content.js';
import { SPRING, EASE, tick } from './lib.jsx';

const S = 600, C = S / 2;                 // viewBox
const R0 = 46, PER = 8.6, RINGS = [5, 10, 15, 20, 25];
const rOf = min => R0 + min * PER;        // 25 min -> 261
const EDGE = 284;                          // the other projects sit just outside the last ring

// direction from the project to a place, on the plan (x east, z south)
const dir = (from, to) => { const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1; return [dx / d, dz / d]; };

function geometry(sel) {
  const from = MAP.projects.find(p => p.key === sel);
  const places = MAP.landmarks.map((l, i) => {
    const [ux, uy] = dir(from, l), r = rOf(l.min[sel]);
    return { i, name: l.name, min: l.min[sel], x: C + ux * r, y: C + uy * r, r };
  });
  const others = MAP.projects.filter(p => p.key !== sel).map(p => {
    const [ux, uy] = dir(from, p);
    return { key: p.key, x: C + ux * EDGE, y: C + uy * EDGE };
  });
  return { places, others };
}

// Labels go in the first free spot around their dot: not over another label, another dot, the corner furniture,
// or past the card's edge. Inner places choose first, since they are the most crowded.
const hit = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
function placeLabels(W, places, others, size, jumpSize) {
  const k = W / S, pad = 8, out = {}, jumps = {}, taken = [];
  taken.push({ x: 0, y: 0, w: Math.min(230, W * 0.42), h: 78 }, { x: W - 60, y: 0, w: 60, h: 58 }, { x: 0, y: W - 40, w: W * 0.62, h: 40 });
  taken.push({ x: C * k - 16, y: C * k - 16, w: 32, h: 32 });
  places.forEach(p => taken.push({ x: p.x * k - 9, y: p.y * k - 9, w: 18, h: 18 }));
  for (const o of others) {
    const { w, h } = jumpSize[o.key] || { w: 110, h: 26 };
    const x = Math.min(Math.max(o.x * k - w / 2, pad), W - w - pad), y = Math.min(Math.max(o.y * k - h / 2, 62), W - h - 44);
    jumps[o.key] = { x, y }; taken.push({ x: x - 4, y: y - 4, w: w + 8, h: h + 8 });
  }
  for (const p of [...places].sort((a, b) => a.r - b.r)) {
    const { w, h } = size[p.i] || { w: p.name.length * 6.6 + 52, h: 26 };
    const dx = p.x * k, dy = p.y * k, right = p.x >= C, g = 12;
    const R = { x: dx + g, y: dy - h / 2 }, L = { x: dx - g - w, y: dy - h / 2 };
    const RU = { x: dx + 6, y: dy - h - 8 }, RD = { x: dx + 6, y: dy + 8 }, LU = { x: dx - 6 - w, y: dy - h - 8 }, LD = { x: dx - 6 - w, y: dy + 8 };
    const U = { x: dx - w / 2, y: dy - h - 12 }, D = { x: dx - w / 2, y: dy + 12 };
    const tries = right ? [R, RU, RD, U, D, L, LU, LD] : [L, LU, LD, U, D, R, RU, RD];
    let best = null, bestCost = Infinity;
    for (const t of tries) {
      const box = { x: t.x, y: t.y, w, h };
      const off = Math.max(0, pad - box.x) + Math.max(0, box.x + w - (W - pad)) + Math.max(0, pad - box.y) + Math.max(0, box.y + h - (W - pad));
      const own = { x: dx - 9, y: dy - 9, w: 18, h: 18 };
      const cost = taken.reduce((c, r) => c + (r.x === own.x && r.y === own.y ? 0 : hit(box, r)), 0) + off * 400;
      if (cost < bestCost) { best = box; bestCost = cost; }
      if (cost === 0) break;
    }
    out[p.i] = best; taken.push({ x: best.x - 3, y: best.y - 3, w: w + 6, h: h + 6 });
  }
  return { labels: out, jumps };
}

export function Dial({ sel, setSel, hot, setHot }) {
  const { places, others } = useMemo(() => geometry(sel), [sel]);
  const shown = hot >= 0 ? places[hot] : null;
  const box = useRef(null), labelEls = useRef({}), jumpEls = useRef({});
  const [W, setW] = useState(600);
  const [size, setSize] = useState({}), [jumpSize, setJumpSize] = useState({});
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  // measure the labels as drawn (the name hides on a small dial), and lay out again only if a size changed
  useLayoutEffect(() => {
    const read = (els, prev, set) => {
      const next = {}; let changed = false;
      for (const [key, el] of Object.entries(els)) {
        if (!el) continue; const s = { w: el.offsetWidth, h: el.offsetHeight }; next[key] = s;
        if (!prev[key] || Math.abs(prev[key].w - s.w) > 1 || Math.abs(prev[key].h - s.h) > 1) changed = true;
      }
      if (changed) set(next);
    };
    read(labelEls.current, size, setSize); read(jumpEls.current, jumpSize, setJumpSize);
  });
  const { labels, jumps } = useMemo(() => placeLabels(W, places, others, size, jumpSize), [W, places, others, size, jumpSize]);
  return (
    <motion.figure ref={box} className="dial" initial="off" whileInView="on" viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      aria-label={`Drive times from ${PAGES[sel].short}`}>
      <svg viewBox={`0 0 ${S} ${S}`} aria-hidden="true">
        {RINGS.map((m, i) => (
          <motion.circle key={m} className={`dial__ring${m === 25 ? " is-outer" : ""}`} cx={C} cy={C} r={rOf(m)}
            variants={{ off: { scale: 0.6, opacity: 0 }, on: { scale: 1, opacity: 1 } }} style={{ transformOrigin: '50% 50%' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.08 * i }} />
        ))}
        {RINGS.map(m => (
          <text key={m} className="dial__tick" x={C} y={C - rOf(m) + 4} textAnchor="middle">{m}</text>
        ))}
        <motion.g variants={{ off: { opacity: 0 }, on: { opacity: 1 } }} transition={{ duration: 0.6, delay: 0.4 }}>
          {places.map(p => (
            <motion.line key={p.name} className={`dial__spoke${hot === p.i ? ' is-on' : ''}`} x1={C} y1={C}
              initial={false} animate={{ x2: p.x, y2: p.y }} transition={SPRING} />
          ))}
        </motion.g>
        <circle className="dial__pulse" cx={C} cy={C} r={14} />
        <circle className="dial__home" cx={C} cy={C} r={9} />
        {places.map(p => (
          <motion.circle key={p.name} className={`dial__dot${hot === p.i ? ' is-on' : ''}`} r={hot === p.i ? 8 : 5.5}
            initial={false} animate={{ cx: p.x, cy: p.y }} transition={SPRING} />
        ))}
      </svg>

      {places.map(p => (
        <motion.button key={p.name} ref={el => { labelEls.current[p.i] = el; }} type="button"
          className={`dial__label${hot === p.i ? ' is-on' : ''}`}
          initial={false} animate={{ left: labels[p.i].x, top: labels[p.i].y }} transition={SPRING}
          onMouseEnter={() => setHot(p.i)} onMouseLeave={() => setHot(-1)} onFocus={() => setHot(p.i)} onBlur={() => setHot(-1)}
          onClick={() => { setHot(p.i); tick(); }}>
          <span className="dial__name">{p.name}</span><b className="num">{p.min} min</b>
        </motion.button>
      ))}
      {others.map(o => (
        <motion.button key={o.key} ref={el => { jumpEls.current[o.key] = el; }} type="button" className="dial__jump" initial={false}
          animate={{ left: jumps[o.key].x, top: jumps[o.key].y }} transition={SPRING}
          onClick={() => { setSel(o.key); tick(); }} aria-label={`Show drive times from ${PAGES[o.key].short}`}>
          {PAGES[o.key].short}
        </motion.button>
      ))}

      <div className="dial__from">
        <small>Drive times from</small>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.strong key={sel} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}>{PAGES[sel].short}</motion.strong>
        </AnimatePresence>
      </div>
      <span className="dial__north" aria-hidden="true">N</span>
      <figcaption className="dial__key">
        <AnimatePresence mode="wait" initial={false}>
          {shown
            ? <motion.span key={shown.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><b>{shown.name}</b> · {shown.min} min by car</motion.span>
            : <motion.span key="key" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Rings every 5 minutes by car</motion.span>}
        </AnimatePresence>
      </figcaption>
    </motion.figure>
  );
}
