// Small shared pieces: a history router, and the motion helpers every page uses.
import { Fragment, forwardRef, useSyncExternalStore, useRef, useEffect, useState, createContext, useContext } from 'react';
import { scrollToY } from './smooth.js';
import { motion, useInView, useMotionValue, useSpring, useScroll, useTransform, useReducedMotion, useMotionTemplate, animate } from 'framer-motion';

export const EASE = [0.2, 0.7, 0.2, 1];
// Apple's two springs: critically damped for ordinary state changes, a little bounce only after a flick or a drag
export const SPRING = { type: 'spring', bounce: 0, duration: 0.4 };
export const FLICK = { type: 'spring', bounce: 0.2, duration: 0.45 };
// where a release at v px/s comes to rest (the scroll-deceleration projection)
export const project = (v, d = 0.992) => (v / 1000) * d / (1 - d);
// one short haptic on a commit or a snap, where the device has one
export const tick = () => { try { navigator.vibrate && navigator.vibrate(8); } catch {} };

/* ---------- router ---------- */
const subs = new Set();
const notify = () => subs.forEach(f => f());
// Back and forward return to where you were on that page: each history entry remembers its scroll position,
// and the page transition hands it back once the old page has left (see takeScroll in App.jsx)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let landY = 0;
window.addEventListener('popstate', () => { landY = (history.state && history.state.y) || 0; notify(); });
export const takeScroll = () => { const y = landY; landY = 0; return y; };
// The site may live under a folder (GitHub Pages serves it at /tamala-homes/). App paths stay '/projects/x';
// BASE is added on the way out to the address bar and to files, and taken off on the way in.
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');
const strip = p => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) : p).replace(/\/+$/, '') || '/';
const clean = () => strip(location.pathname);
// every photo in media/img also comes 1200, 800 and 480 px wide (made by scripts/sizes.mjs); the browser picks the
// smallest that fills the slot at the screen's pixel density (a 390 px phone at 3x wants 1200). The full-size file is
// 1100 to 1800 px; it is listed as 1800w, so only wide, sharp screens fetch it.
export const srcSet = src => {
  const m = typeof src === 'string' && src.match(/^(.*\/media\/img\/)([^/]+\.webp)$/);
  return m ? `${m[1]}480/${m[2]} 480w, ${m[1]}800/${m[2]} 800w, ${m[1]}1200/${m[2]} 1200w, ${src} 1800w` : undefined;
};
const full = to => (to.startsWith('/') ? BASE + to : to);
export function navigate(to) {
  const [p, h] = to.split('#');
  // the same page without a section (the logo after a #map link, say): go to the top and drop the section from the address
  if (!h && strip(full(p || '/')) === clean()) {
    scrollToY(0);
    if (location.hash) history.replaceState(history.state, '', full(p || '/'));
    return;
  }
  history.replaceState({ ...(history.state || {}), y: scrollY }, '');   // remember where we were, for Back
  history.pushState({}, '', full(to)); notify();
}
export function usePath() {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, clean);
}
export function Link({ to, children, onClick, ...rest }) {
  return (
    <a href={full(to)} {...rest} onClick={e => {
      onClick && onClick(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const u = new URL(full(to), location.href);
      if (u.origin !== location.origin) return;
      if (u.pathname.replace(/\/+$/, '') === location.pathname.replace(/\/+$/, '') && u.hash) return;   // same-page anchor: the browser scrolls
      e.preventDefault(); navigate(strip(u.pathname) + u.hash);
    }}>{children}</a>
  );
}

/* ---------- the intro has finished: heroes wait for this before they enter ---------- */
export const Ready = createContext(true);
export const useReady = () => useContext(Ready);

/* ---------- words that rise out of a mask, one after another, once ---------- */
// a word or phrase wrapped in *asterisks* is set in italic: 'Where we build in *Guntur*'
const emParts = text => text.split(/(\*[^*]+\*)/).filter(Boolean).map(t => (t.startsWith('*') ? { t: t.slice(1, -1), em: true } : { t: t.trim() })).filter(p => p.t);
export function Words({ as: Tag = 'h2', parts, text, className, delay = 0, step = 0.045, show, id }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const on = show === undefined ? seen : show;
  const list = (parts || [{ t: text }]).flatMap(p => (p.t.includes('*') ? emParts(p.t).map(q => ({ ...p, ...q, em: q.em || p.em })) : [p]));
  let i = 0;
  return (
    <Tag ref={ref} id={id} className={className} aria-label={list.map(p => p.t).join(' ')}>
      {list.map((p, pi) => (
        <span key={pi} className={[p.muted && 'is-muted', p.em && 'is-em'].filter(Boolean).join(' ') || undefined} aria-hidden="true">
          {p.t.split(' ').map((w, wi) => {
            const d = delay + step * i++;
            return (
              <Fragment key={wi}>
                <span className="w">
                  <motion.span className="w__in" initial={{ y: '112%' }} animate={{ y: on ? '0%' : '112%' }}
                    transition={{ duration: 0.9, ease: EASE, delay: d }}>{w}</motion.span>
                </span>{' '}
              </Fragment>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/* ---------- a block that fades up when it arrives ---------- */
export const Rise = forwardRef(function Rise({ as = 'div', delay = 0, y = 26, children, ...rest }, ref) {
  const M = motion[as];
  return (
    <M ref={ref} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }} {...rest}>{children}</M>
  );
});

/* ---------- a picture that unmasks from the bottom and drifts inside its frame ---------- */
export function Picture({ src, alt, className = '', pos, strength = 8, reveal = true, eager, sizes = '(max-width: 1023px) 100vw, 50vw', ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <motion.div ref={ref} className={`pic ${className}`} {...rest}
      initial={reveal ? { clipPath: 'inset(100% 0% 0% 0%)' } : false} whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', transitionEnd: { clipPath: 'none' } }}   // unmasked: drop the mask so a shadow can show
      viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: 1.2, ease: EASE }}>
      <motion.img src={src} srcSet={srcSet(src)} sizes={sizes} alt={alt} loading={eager ? 'eager' : 'lazy'} style={{ y: reduce ? 0 : y, objectPosition: pos }} />
    </motion.div>
  );
}

/* ---------- a control that leans toward the pointer ---------- */
export function Magnetic({ children, pull = 0.28, className }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 32 }), sy = useSpring(y, { stiffness: 260, damping: 32 });   // critically damped: no wobble
  return (
    <motion.span className={`magnetic ${className || ''}`} style={{ x: sx, y: sy }}
      onPointerMove={e => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * pull); y.set((e.clientY - (r.top + r.height / 2)) * pull);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>{children}</motion.span>
  );
}

/* ---------- a card that floats a layer above the page: it lifts and leans toward the mouse, with a soft glare ---------- */
// The side under the pointer rises toward you, the shadow deepens and slides with the lean, and a glare follows the
// pointer. Critically damped springs, so it settles without a wobble. Mouse only: on touch it rests raised and still.
const LEAN = { stiffness: 210, damping: 29 };
// the lean as a hook, so a motion element that already exists (a gallery photo, say) can take it without a wrapper
export function useTilt(max = 5) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0), ry = useMotionValue(0), up = useMotionValue(0);
  const gx = useMotionValue(50), gy = useMotionValue(20);
  const sx = useSpring(rx, LEAN), sy = useSpring(ry, LEAN), lift = useSpring(up, LEAN);
  const y = useTransform(lift, v => v * -8);
  const boxShadow = useTransform([sy, lift], ([b, l]) => {
    const ox = -b * 1.6, d = 1 + l * 0.7;
    return `0 1px 1px rgb(15 35 29 / .05), ${(ox * 0.4).toFixed(1)}px ${(6 * d).toFixed(1)}px ${(14 * d).toFixed(1)}px -4px rgb(15 35 29 / ${(0.08 + l * 0.04).toFixed(3)}), `
      + `${ox.toFixed(1)}px ${(26 * d).toFixed(1)}px ${(56 * d).toFixed(1)}px -18px rgb(15 35 29 / ${(0.2 + l * 0.08).toFixed(3)})`;
  });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 255 255 / .28), rgb(255 255 255 / 0) 55%)`;
  const onPointerMove = e => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    rx.set((py - 0.5) * 2 * max); ry.set(-(px - 0.5) * 2 * max); up.set(1);
    gx.set(px * 100); gy.set(py * 100);
  };
  const onPointerLeave = () => { rx.set(0); ry.set(0); up.set(0); };
  return {
    handlers: { onPointerMove, onPointerLeave },
    style: reduce ? {} : { rotateX: sx, rotateY: sy, y, boxShadow },
    glare: <motion.i className="tilt__glare" aria-hidden="true" style={{ backgroundImage: glare, opacity: lift }} />,
  };
}
export function Tilt({ children, className = '', max = 5 }) {
  const t = useTilt(max);
  return <motion.div className={`tilt ${className}`} {...t.handlers} style={t.style}>{children}{t.glare}</motion.div>;
}

/* ---------- a number that counts up once ---------- */
export function Counter({ to, suffix = '', duration = 1.6 }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!seen || reduce) return;
    const c = animate(0, to, { duration, ease: EASE, onUpdate: v => setN(Math.round(v)) });
    return () => c.stop();
  }, [seen, to, duration, reduce]);
  return <span ref={ref} className="num">{n}{suffix}</span>;
}

export const Arrow = () => (
  <svg className="arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h9M6 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
);

// true once the element comes within a screen or so of the viewport, and stays true: heavy embeds (a Google map,
// with its own scripts) mount only then, so they cost nothing to visitors who never scroll that far
export const useNear = (ref, margin = '600px 0px') => useInView(ref, { once: true, margin });

// Keeps the keyboard inside an open layer (the phone menu, the photo viewer): Tab and Shift+Tab go round its controls
// only, Escape closes it, and focus goes back where it was when it closes. `els` lists the layer's own elements
// (a container, or a button that sits outside it, like the menu's close button in the bar).
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
export function useFocusTrap(active, els, onClose, first) {
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const before = document.activeElement;
    const list = () => els().filter(Boolean).flatMap(e => (e.matches(FOCUSABLE) ? [e] : [...e.querySelectorAll(FOCUSABLE)]))
      .filter(e => e.offsetParent !== null || e === document.activeElement);
    { const f = (first && first()) || list()[0]; f && f.focus({ preventScroll: true }); }   // the layer is in the page by now: focus it at once
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const l = list(); if (!l.length) return;
      const i = l.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); l[l.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === l.length - 1)) { e.preventDefault(); l[0].focus(); }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      if (before && before.focus && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [active]);   // eslint-disable-line react-hooks/exhaustive-deps
}

export function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q); const f = () => setM(mq.matches);
    mq.addEventListener('change', f); return () => mq.removeEventListener('change', f);
  }, [q]);
  return m;
}
