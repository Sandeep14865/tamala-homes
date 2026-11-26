// The site's signature moments, shared by the home and project pages:
//   Dome     a dark section rises in with a curved top edge that flattens as it arrives
//   Leaf     a photograph opens out of the Tamala leaf and grows to fill the screen
//   Marquee  a band of giant words that drifts, and speeds up and leans with the scroll
//   Giant    one word set across the whole width, its letters rising in, drifting slightly with the scroll
//   Chapter  the section's number and name over its heading, with a rule that draws in
// Every one of them rests, fully shown, when the visitor asks for less motion.
import { useLayoutEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useVelocity, useMotionValue, useAnimationFrame, useReducedMotion, useInView } from 'framer-motion';
import { EASE, srcSet } from './lib.jsx';

/* ---------- Dome ---------- */
// `under` is the colour of the section above, which shows in the corners while the edge is still curved
export function Dome({ under = 'var(--bg)', depth = 16, children }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.2'] });
  // a clip, not a squeeze: the sides draw in a little and the top corners curve, and nothing inside is distorted
  // (a clip also leaves sticky elements inside working, where overflow would not)
  const clip = useTransform(scrollYProgress, p => {
    const v = 1 - p, side = (v * 3).toFixed(2), d = (v * depth).toFixed(2);
    return `inset(0% ${side}% 0% ${side}% round 50% 50% 0 0 / ${d}vmin ${d}vmin 0 0)`;   // vmin: as gentle on a phone as on a wide screen
  });
  return (
    <div className="dome" ref={ref} style={{ background: under }}>
      <motion.div className="dome__in" style={reduce ? undefined : { clipPath: clip }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- Leaf ---------- */
// the logo's leaf as a mask; it grows from a small leaf in the middle of the screen to far past its edges
const LEAF = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21C3 10 10 3 21 3c0 11-7 18-18 18z"/></svg>')}")`;
export function Leaf({ src, alt, pos = '50% 50%' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  // the leaf waits small while the frame arrives, then opens through the middle of the scroll and is gone by the end
  const size = useTransform(scrollYProgress, [0, 0.35, 0.9], [26, 34, 520]);
  const mask = useTransform(size, v => (v > 500 ? 'none' : LEAF));
  const maskSize = useTransform(size, v => `${v}vmin ${v}vmin`);
  const turn = useTransform(scrollYProgress, [0.35, 0.9], [-12, 0]);
  const scale = useTransform(scrollYProgress, [0.35, 1], [1.25, 1]);
  const shade = useTransform(scrollYProgress, [0.6, 1], [0, 0.28]);
  if (reduce) {
    return <div className="leaf leaf--still"><img src={src} srcSet={srcSet(src)} sizes="100vw" alt={alt} loading="lazy" style={{ objectPosition: pos }} /></div>;
  }
  return (
    <div className="leaf" ref={ref}>
      <div className="leaf__stage">
        <motion.div className="leaf__mask" style={{ WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: maskSize, maskSize, rotate: turn }}>
          <motion.img src={src} srcSet={srcSet(src)} sizes="100vw" alt={alt} loading="lazy" style={{ scale, objectPosition: pos }} />
          <motion.i className="leaf__shade" style={{ opacity: shade }} />
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Marquee ---------- */
const wrap = (min, max, v) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };
export function Marquee({ words, speed = 2.2, tone = 'ink' }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const v = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(v, [-2000, 0, 2000], [-5, 0, 5], { clamp: false });
  const skew = useTransform(v, [-2500, 0, 2500], [6, 0, -6]);
  const dir = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) dir.current = -1; else if (b > 0) dir.current = 1;
    const move = dir.current * speed * (delta / 1000) * (1 + Math.abs(b));
    x.set(wrap(-50, 0, x.get() - move));
  });
  const xs = useTransform(x, n => `${n}%`);
  const row = words.map((w, i) => (
    <span key={i} className={i % 2 ? 'marquee__word is-hollow' : 'marquee__word'}>{w}<i className="marquee__dot" /></span>
  ));
  return (
    <div className={`marquee marquee--${tone}`} aria-hidden="true">
      <motion.div className="marquee__track" style={reduce ? undefined : { x: xs, skewX: skew }}>
        <div className="marquee__row">{row}</div><div className="marquee__row">{row}</div>
      </motion.div>
    </div>
  );
}

/* ---------- Giant ---------- */
// the word is measured and set to fill the width between the gutters exactly, whatever its length or the font's widths
export function Giant({ text, className = '' }) {
  const ref = useRef(null), inner = useRef(null);
  const reduce = useReducedMotion();
  const seen = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['1.5%', '-1.5%']);
  useLayoutEffect(() => {
    const p = ref.current, w = inner.current;
    const fit = () => {
      p.style.fontSize = '100px';
      const cs = getComputedStyle(p), room = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const width = w.getBoundingClientRect().width;
      if (width) p.style.fontSize = `${(100 * room * 0.97 / width).toFixed(2)}px`;   // a little in from each gutter, for the drift
    };
    fit(); document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit); ro.observe(p);
    return () => ro.disconnect();
  }, [text]);
  return (
    <motion.p ref={ref} className={`giant ${className}`} aria-hidden="true" style={{ x: reduce ? 0 : x }}>
      <span className="giant__in" ref={inner}>
        {text.split('').map((ch, i) => (
          <span className="w" key={i}>
            <motion.span className="w__in" initial={reduce ? false : { y: '102%' }} animate={{ y: seen || reduce ? '0%' : '102%' }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.04 * i }}>{ch === ' ' ? '\u00a0' : ch}</motion.span>
          </span>
        ))}
      </span>
    </motion.p>
  );
}

/* ---------- Chapter ---------- */
export function Chapter({ n, children }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  return (
    <p className="chapter" ref={ref}>
      <span className="num">{String(n).padStart(2, '0')}</span>
      <motion.i aria-hidden="true" initial={{ scaleX: 0 }} animate={{ scaleX: seen ? 1 : 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.1 }} />
      <span>{children}</span>
    </p>
  );
}
