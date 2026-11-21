// The travelling shape: one turmeric form that follows the home page story. Each section marks a resting spot
// with <Spot shape="…" />; the shape rests on a spot when that spot crosses the middle of the screen, and glides
// (shrinking to a dot) to the next one in between. It changes form at every stop: a map pin where we build,
// a key ring for the handover promise, a brick for the build stages, a sun for amenities, a target for the visit.
// On desktop the resting shape also carries the section's name, set round a circle just inside its edge;
// on a phone, where the shape is too small for that, one word slides out beside it instead.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';

// one resting size for every shape, so the names round their edges all read at the same size (about 12px on desktop)
const SIZE = 136;
// [corner radii in % x4, rotation deg, fill 0..1, ring width as a share of size, inner dot 0..1, size px on desktop]
const SHAPES = {
  pin:    { r: [50, 50, 50, 0],  rot: -45, fill: 1, ring: 0,    dot: 1, size: SIZE },
  ring:   { r: [50, 50, 50, 50], rot: 0,   fill: 0, ring: 0.17, dot: 0, size: SIZE },
  brick:  { r: [14, 14, 14, 14], rot: 12,  fill: 1, ring: 0,    dot: 0, size: SIZE },
  sun:    { r: [50, 50, 50, 50], rot: 90,  fill: 1, ring: 0,    dot: 0, size: SIZE },
  target: { r: [50, 50, 50, 50], rot: 180, fill: 0, ring: 0.13, dot: 1, size: SIZE },
};
// the name each shape carries, the circle it runs on (radius in a 100-unit box) and its colour
const LABELS = {
  pin:    { text: 'Where we build', r: 36, ink: '#000' },
  ring:   { text: 'Our promise',    r: 38, ink: '#000' },        // on the band itself: the hole shows the dark section
  brick:  { text: 'How we build',   r: 36, ink: '#000' },
  sun:    { text: 'Amenities',      r: 36, ink: '#000' },
  target: { text: 'Visit us',       r: 27, ink: '#000' },
};
// the one word that slides out beside the shape on a phone
const WORDS = { pin: 'Map', ring: 'Promise', brick: 'Build', sun: 'Amenities', target: 'Visit' };
const FS = 9;   // font size in box units: about 12px at rest on desktop
// a full circle from the top, clockwise, so the letters stand on it facing out
const circle = r => `M50,${50 - r} a${r},${r} 0 1,1 0,${2 * r} a${r},${r} 0 1,1 0,${-2 * r}`;
const unitOf = text => `${text.toUpperCase()}\u00a0\u00a0·\u00a0\u00a0`;   // fixed spaces: SVG would fold plain ones
// repeat the name, with a dot between, as many times as sits evenly round the circle: measured once the font is in,
// so short names repeat and long ones keep their natural letter spacing
function fit(svg) {
  svg.querySelectorAll('textPath').forEach(tp => {
    const l = LABELS[tp.parentNode.dataset.k], unit = unitOf(l.text), len = 2 * Math.PI * l.r;
    tp.removeAttribute('textLength'); tp.textContent = unit;
    const w = tp.parentNode.getComputedTextLength();
    if (!w) return;
    const n = Math.max(1, Math.floor(len / (w * 1.02)));   // never squeeze: spare room goes between the letters
    tp.textContent = unit.repeat(n); tp.setAttribute('textLength', len.toFixed(2));
  });
}
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = v => Math.min(1, Math.max(0, v));

export function Spot({ shape }) {
  return <span className="orb-spot" data-orb={shape} aria-hidden="true" />;
}

export function Orb() {
  const still = useReducedMotion();
  const el = useRef(null), dot = useRef(null), names = useRef(null), tag = useRef(null);
  useEffect(() => {
    if (still) return;
    const orb = el.current, inner = dot.current, svg = names.current, label = tag.current, word = label.firstChild;
    const texts = [...svg.querySelectorAll('text')];
    fit(svg); document.fonts?.ready.then(() => fit(svg));
    let raf = 0;
    // The shape sits on the page, not on the screen: where it rests, it is at the spot's place in the document and
    // scrolls with the content natively, so a phone's momentum scroll can't leave it lagging and jumping behind.
    // A phone's toolbar grows and shrinks the window while you scroll; only a width change counts as a real resize.
    const touch = matchMedia('(pointer: coarse)').matches;
    let W = innerWidth, VH = innerHeight;
    const frame = () => {
      raf = 0;
      const spots = [...document.querySelectorAll('.orb-spot')];
      if (!spots.length) { orb.style.opacity = 0; return; }
      if (!touch || innerWidth !== W) { W = innerWidth; VH = innerHeight; }
      const vh = VH, mid = vh / 2, small = innerWidth < 900 ? 0.5 : 1;
      const at = spots.map(s => { const r = s.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top, Y: r.top + scrollY, k: s.dataset.orb, s: SHAPES[s.dataset.orb] || SHAPES.sun }; });
      // the spot just above the middle of the screen and the one just below it
      let i = at.findIndex(a => a.y > mid) - 1;
      let a, b, t;
      if (i === -2) { a = b = at[at.length - 1]; t = 0; }            // every spot has passed: rest on the last
      else if (i === -1) { a = b = at[0]; t = 0; }                   // none reached yet: wait on the first
      else { a = at[i]; b = at[i + 1]; t = clamp01((mid - a.y) / (b.y - a.y)); }
      // the shape holds still, full size, on each spot (riding along with the page) for the first third of the way and
      // the last quarter, so its name can be read; it travels only in between
      t = clamp01((t - 0.32) / 0.43);
      const e = ease(t), dip = 1 - 0.68 * Math.sin(Math.PI * t);   // a dot in transit, full size at rest
      const size = lerp(a.s.size, b.s.size, e) * small * dip;
      const x = lerp(a.x, b.x, e), y = lerp(a.Y, b.Y, e);   // page coordinates
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
      // the names: only while the shape rests near a spot, and a slow turn as the page scrolls
      const rest = clamp01((dip - 0.72) / 0.28);
      svg.style.left = svg.style.top = `${-ring}px`; svg.style.width = svg.style.height = `${size}px`;
      svg.style.transform = `rotate(${scrollY * 0.04}deg)`;
      texts.forEach(n => { const k = n.dataset.k; n.style.opacity = rest * ((k === a.k ? 1 - e : 0) + (k === b.k ? e : 0)); });
      // the phone label: it slides out from behind the shape's left side while the shape rests, and back in as it leaves;
      // the word only changes while it is tucked away
      const near = e < 0.5 ? a.k : b.k;
      if (word.textContent !== WORDS[near] && (rest < 0.05 || !word.textContent)) word.textContent = WORDS[near] || '';
      label.style.opacity = show * Math.min(1, rest * 1.6);
      label.style.transform = `translate3d(${x - size / 2 - 6}px, ${y}px, 0) translate(-100%, -50%)`;
      word.style.transform = `translateX(${(1 - rest) * 105}%)`;
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask);
    const ro = new ResizeObserver(ask); ro.observe(document.body);
    ask();
    return () => { removeEventListener('scroll', ask); removeEventListener('resize', ask); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [still]);
  if (still) return null;
  return createPortal(
    <>
    <span className="orb-tag" ref={tag} aria-hidden="true"><b /></span>
    <div className="orb" ref={el} aria-hidden="true">
      <i ref={dot} />
      <svg className="orb__names" ref={names} viewBox="0 0 100 100">
        <defs>{Object.entries(LABELS).map(([k, l]) => <path key={k} id={`orb-path-${k}`} d={circle(l.r)} />)}</defs>
        {Object.entries(LABELS).map(([k, l]) => (
          <text key={k} data-k={k} fill={l.ink} fontSize={FS} style={{ opacity: 0 }}>
            <textPath href={`#orb-path-${k}`} lengthAdjust="spacing">{unitOf(l.text)}</textPath>
          </text>
        ))}
      </svg>
    </div>
    </>,
    document.body
  );
}
