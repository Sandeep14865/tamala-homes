// The travelling shape: one turmeric form that follows the home page story. Each section marks a resting spot
// with <Spot shape="…" />; the shape rests on a spot when that spot crosses the middle of the screen, and glides
// (shrinking to a dot) to the next one in between. It changes form at every stop: a map pin where we build,
// a key ring for the handover promise, a brick for the build stages, a sun for amenities, a target for the visit.
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// [corner radii in % x4, rotation deg, fill 0..1, ring width as a share of size, inner dot 0..1, size px on desktop]
const SHAPES = {
  pin:    { r: [50, 50, 50, 0],  rot: -45, fill: 1, ring: 0,    dot: 1, size: 112 },
  ring:   { r: [50, 50, 50, 50], rot: 0,   fill: 0, ring: 0.17, dot: 0, size: 150 },
  brick:  { r: [14, 14, 14, 14], rot: 12,  fill: 1, ring: 0,    dot: 0, size: 118 },
  sun:    { r: [50, 50, 50, 50], rot: 90,  fill: 1, ring: 0,    dot: 0, size: 104 },
  target: { r: [50, 50, 50, 50], rot: 180, fill: 0, ring: 0.13, dot: 1, size: 126 },
};
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = v => Math.min(1, Math.max(0, v));

export function Spot({ shape }) {
  return <span className="orb-spot" data-orb={shape} aria-hidden="true" />;
}

export function Orb() {
  const still = useReducedMotion();
  const el = useRef(null), dot = useRef(null);
  useEffect(() => {
    if (still) return;
    const orb = el.current, inner = dot.current;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const spots = [...document.querySelectorAll('.orb-spot')];
      if (!spots.length) { orb.style.opacity = 0; return; }
      const vh = innerHeight, mid = vh / 2, small = innerWidth < 900 ? 0.5 : 1;
      const at = spots.map(s => { const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, s: SHAPES[s.dataset.orb] || SHAPES.sun }; });
      // the spot just above the middle of the screen and the one just below it
      let i = at.findIndex(a => a.y > mid) - 1;
      let a, b, t;
      if (i === -2) { a = b = at[at.length - 1]; t = 0; }            // every spot has passed: rest on the last
      else if (i === -1) { a = b = at[0]; t = 0; }                   // none reached yet: wait on the first
      else { a = at[i]; b = at[i + 1]; t = clamp01((mid - a.y) / (b.y - a.y)); }
      const e = ease(t), dip = 1 - 0.68 * Math.sin(Math.PI * t);   // a dot in transit, full size at rest
      const size = lerp(a.s.size, b.s.size, e) * small * dip;
      const x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e);
      // fade in as the first spot rises into view; nothing over the hero film
      const show = clamp01((vh * 1.05 - at[0].y) / (vh * 0.35));
      const r = a.s.r.map((v, k) => lerp(v, b.s.r[k], e));
      const ring = lerp(a.s.ring, b.s.ring, e) * size;
      orb.style.opacity = show;
      orb.style.width = orb.style.height = `${size}px`;
      orb.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) rotate(${lerp(a.s.rot, b.s.rot, e)}deg) scale(${0.6 + 0.4 * show})`;
      orb.style.borderRadius = r.map(v => `${v}%`).join(' ');
      orb.style.setProperty('--fill', lerp(a.s.fill, b.s.fill, e));
      orb.style.borderWidth = `${ring}px`;
      inner.style.opacity = lerp(a.s.dot, b.s.dot, e) * (t > 0.15 && t < 0.85 ? 0 : 1);
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask);
    const ro = new ResizeObserver(ask); ro.observe(document.body);
    ask();
    return () => { removeEventListener('scroll', ask); removeEventListener('resize', ask); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [still]);
  if (still) return null;
  return <div className="orb" ref={el} aria-hidden="true"><i ref={dot} /></div>;
}
