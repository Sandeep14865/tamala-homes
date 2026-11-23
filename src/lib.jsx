// Small shared pieces: a history router, and the motion helpers every page uses.
import { Fragment, useSyncExternalStore, useRef, useEffect, useState, createContext, useContext } from 'react';
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
const full = to => (to.startsWith('/') ? BASE + to : to);
export function navigate(to) {
  const [p, h] = to.split('#');
  // the same page without a section (the logo after a #map link, say): go to the top and drop the section from the address
  if (!h && strip(full(p || '/')) === clean()) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
export function Words({ as: Tag = 'h2', parts, text, className, delay = 0, step = 0.045, show, id }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const on = show === undefined ? seen : show;
  const list = parts || [{ t: text }];
  let i = 0;
  return (
    <Tag ref={ref} id={id} className={className} aria-label={list.map(p => p.t).join(' ')}>
      {list.map((p, pi) => (
        <span key={pi} className={p.muted ? 'is-muted' : undefined} aria-hidden="true">
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
export function Rise({ as = 'div', delay = 0, y = 26, children, ...rest }) {
  const M = motion[as];
  return (
    <M initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }} {...rest}>{children}</M>
  );
}

/* ---------- a picture that unmasks from the bottom and drifts inside its frame ---------- */
export function Picture({ src, alt, className = '', pos, strength = 8, reveal = true, eager, ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <motion.div ref={ref} className={`pic ${className}`} {...rest}
      initial={reveal ? { clipPath: 'inset(100% 0% 0% 0%)' } : false} whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: 1.2, ease: EASE }}>
      <motion.img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} style={{ y: reduce ? 0 : y, objectPosition: pos }} />
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
export function Tilt({ children, className = '', max = 5 }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0), ry = useMotionValue(0), up = useMotionValue(0);
  const gx = useMotionValue(50), gy = useMotionValue(20);
  const sx = useSpring(rx, LEAN), sy = useSpring(ry, LEAN), lift = useSpring(up, LEAN);
  const y = useTransform(lift, v => v * -8);
  const shadow = useTransform([sy, lift], ([b, l]) => {
    const ox = (-b * 1.6).toFixed(1), d = 1 + l * 0.7;
    return `0 1px 1px rgb(15 35 29 / .05), ${ox * 0.4}px ${(6 * d).toFixed(1)}px ${(14 * d).toFixed(1)}px -4px rgb(15 35 29 / ${(0.08 + l * 0.04).toFixed(3)}), `
      + `${ox}px ${(26 * d).toFixed(1)}px ${(56 * d).toFixed(1)}px -18px rgb(15 35 29 / ${(0.2 + l * 0.08).toFixed(3)})`;
  });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 255 255 / .28), rgb(255 255 255 / 0) 55%)`;
  const move = e => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    rx.set((py - 0.5) * 2 * max); ry.set(-(px - 0.5) * 2 * max); up.set(1);
    gx.set(px * 100); gy.set(py * 100);
  };
  const leave = () => { rx.set(0); ry.set(0); up.set(0); };
  return (
    <motion.div className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}
      style={reduce ? undefined : { rotateX: sx, rotateY: sy, y, boxShadow: shadow }}>
      {children}
      <motion.i className="tilt__glare" aria-hidden="true" style={{ backgroundImage: glare, opacity: lift }} />
    </motion.div>
  );
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

export function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q); const f = () => setM(mq.matches);
    mq.addEventListener('change', f); return () => mq.removeEventListener('change', f);
  }, [q]);
  return m;
}
