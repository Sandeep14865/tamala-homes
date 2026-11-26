// Shared pieces of the site: intro, cursor, nav, hero, 3D frame, visit form, footer.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useMotionValueEvent, useReducedMotion, useInView, animate } from 'framer-motion';
import { Spot } from './Orb.jsx';
import { Link, BASE, Words, Rise, Picture, Magnetic, Arrow, EASE, SPRING, tick, useReady, useMedia, srcSet, useFocusTrap } from './lib.jsx';
import { CONTACT } from './data.js';
import { PAGES, ORDER, HOURS } from './content.js';
import { webglOK } from './three/gl.js';
import { Chapter, Dome, LEAF_D, APERTURE } from './fx.jsx';

const wa = (msg) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
const gmaps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/* ---------- intro: a turmeric leaf draws itself while the count runs; then the leaf becomes a window and opens ---------- */
const SHUT = '0vmin 0vmin, 100% 100%', LEAF_START = '11vmin 11vmin, 100% 100%', OPEN = '640vmin 640vmin, 100% 100%';
export function Preloader({ onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, 100, { duration: 1.6, ease: [0.6, 0, 0.2, 1], onUpdate: v => setN(Math.round(v)), onComplete: onDone });
    const t = setTimeout(onDone, 3200);          // a throttled tab never holds the page behind the intro
    // never lock input behind an animation: any press, key or scroll skips the intro
    const skip = () => onDone();
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    evs.forEach(n => addEventListener(n, skip, { once: true, passive: true }));
    return () => { c.stop(); clearTimeout(t); evs.forEach(n => removeEventListener(n, skip)); };
  }, [onDone]);
  return (
    <motion.div className="intro" aria-hidden="true"
      style={{ WebkitMaskImage: APERTURE, maskImage: APERTURE, WebkitMaskSize: SHUT, maskSize: SHUT }}
      exit={{ WebkitMaskSize: [LEAF_START, OPEN], maskSize: [LEAF_START, OPEN] }}
      transition={{ duration: 1.35, ease: [0.76, 0, 0.24, 1] }}>
      <p className="intro__mark">Tamala Homes</p>
      <svg className="intro__leaf" viewBox="0 0 24 24">
        <motion.path d={LEAF_D} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} style={{ fillOpacity: n / 100 }}
          transition={{ duration: 1.3, ease: EASE }} />
      </svg>
      <div className="intro__foot"><span className="intro__count num">{String(n).padStart(3, '0')}</span><span>Guntur, Andhra Pradesh</span></div>
    </motion.div>
  );
}

/* ---------- a ring that trails the pointer and names what a press will do ---------- */
export function Cursor() {
  const fine = useMedia('(hover: hover) and (pointer: fine)');
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.4 }), sy = useSpring(y, { stiffness: 420, damping: 34, mass: 0.4 });
  const [label, setLabel] = useState(''); const [over, setOver] = useState(false); const [down, setDown] = useState(false);
  useEffect(() => {
    if (!fine) return;
    const move = e => { x.set(e.clientX); y.set(e.clientY); };
    const hover = e => {
      const t = e.target instanceof Element ? e.target : null;
      const c = t && t.closest('[data-cursor]');
      setLabel(c ? c.dataset.cursor : '');
      setOver(!!(t && t.closest('a, button, select, input, [tabindex]')));
    };
    const d = () => setDown(true), u = () => setDown(false);
    addEventListener('pointermove', move); addEventListener('pointerover', hover); addEventListener('pointerdown', d); addEventListener('pointerup', u);
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerover', hover); removeEventListener('pointerdown', d); removeEventListener('pointerup', u); };
  }, [fine, x, y]);
  if (!fine) return null;
  const size = label ? 84 : over ? 44 : 14;
  return (
    <motion.div className={`cursor${label ? ' has-label' : ''}`} style={{ x: sx, y: sy }} aria-hidden="true">
      <motion.span className="cursor__ring" animate={{ width: size, height: size, scale: down ? 0.85 : 1 }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }}>
        <AnimatePresence>{label && <motion.i key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{label}</motion.i>}</AnimatePresence>
      </motion.span>
    </motion.div>
  );
}

/* ---------- nav: clear over the hero, solid after it; leaves on the way down, returns on the way up ---------- */
export function Nav({ links, solidAlways }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(!!solidAlways);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null), menuRef = useRef(null);
  // while the menu is open the keyboard stays in it (its links and the close button), and Escape closes it
  useFocusTrap(open, () => [toggleRef.current, menuRef.current], () => setOpen(false));
  useMotionValueEvent(scrollY, 'change', v => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(v > prev && v > 240);
    setSolid(solidAlways || v > window.innerHeight * 0.72);
  });
  useEffect(() => { document.documentElement.classList.toggle('is-locked', open); return () => document.documentElement.classList.remove('is-locked'); }, [open]);
  return (
    <>
      <motion.header className={`nav${solid ? ' is-solid' : ''}${open ? ' is-open' : ''}`} animate={{ y: hidden && !open ? '-110%' : '0%' }} transition={SPRING}>
        <a className="skip" href="#main">Skip to content</a>
        <div className="wrap nav__bar">
          <Link className="nav__logo" to="/" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21C3 10 10 3 21 3c0 11-7 18-18 18z" /></svg>Tamala Homes
          </Link>
          <nav className="nav__links" aria-label="Main">
            {links.map(([label, to]) => <Link key={label} className="nav__link" to={to}>{label}</Link>)}
          </nav>
          <a className="btn btn--solid nav__cta" href="#visit">Book a site visit</a>
          <button className="nav__toggle" type="button" ref={toggleRef} aria-controls="menu" aria-expanded={open} aria-label={open ? 'Close the menu' : 'Open the menu'} onClick={() => setOpen(o => !o)}>
            <span /><span />
          </button>
        </div>
      </motion.header>
      <AnimatePresence>
        {open && (
          <motion.div className="menu" id="menu" ref={menuRef} initial={{ clipPath: 'circle(0% at calc(100% - 44px) 34px)' }} animate={{ clipPath: 'circle(160% at calc(100% - 44px) 34px)' }} exit={{ clipPath: 'circle(0% at calc(100% - 44px) 34px)' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.6 }}>
            <nav className="wrap menu__links" aria-label="Menu">
              {[...links, ['Book a site visit', '#visit']].map(([label, to], i) => (
                <span className="w" key={label}>
                  <motion.span className="w__in" initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.06 }}>
                    <Link to={to} onClick={() => setOpen(false)}>{label}</Link>
                  </motion.span>
                </span>
              ))}
            </nav>
            <div className="wrap menu__foot"><a href={`tel:${CONTACT.phone}`}>Call the sales office</a><a href={wa('Hello, I would like to visit a Tamala Homes project.')}>Chat on WhatsApp</a></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- the glass button: clear over a picture, fills blue under the pointer ---------- */
export function GlassCta({ href = '#visit', children = 'Book a site visit' }) {
  return <Magnetic><a className="btn btn--glass" href={href}>{children}<Arrow /></a></Magnetic>;
}

/* ---------- the hero film: loads after the first paint, never for visitors who asked for less motion or less data, nor
   on a slow connection (3G or worse): there the still poster stays, and the play button loads the film on request ---------- */
function useFilm(video) {
  const ready = useReady(), reduce = useReducedMotion(), phone = useMedia('(max-width: 1023px)');
  const [playing, setPlaying] = useState(false);
  const src = phone ? BASE + '/media/hero-720p.mp4' : BASE + '/media/hero-1600.mp4';
  useEffect(() => {
    const v = video.current;
    if (!v || !ready) return;
    const c = navigator.connection;
    const slow = c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ''));
    if (reduce || slow) return;
    v.src = src;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    const io = new IntersectionObserver(([e]) => { if (!v.dataset.paused) e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.05 });
    io.observe(v);
    return () => io.disconnect();
  }, [ready, reduce, src, video]);
  const toggle = () => {
    const v = video.current;
    if (!v.src) v.src = src;
    if (v.paused) { delete v.dataset.paused; v.play().then(() => setPlaying(true)).catch(() => {}); } else { v.dataset.paused = '1'; v.pause(); setPlaying(false); }
  };
  return { playing, toggle, poster: phone ? BASE + '/media/hero-poster-720p.webp' : BASE + '/media/hero-poster-1600.webp' };
}
const PauseButton = ({ film }) => (
  <button className="hero__pause" type="button" onClick={film.toggle} aria-label={film.playing ? 'Pause the film' : 'Play the film'} data-cursor={film.playing ? 'Pause' : 'Play'}>
    {film.playing ? <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" /></svg> : <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2v10l8-5z" /></svg>}
  </button>
);

/* ---------- the home hero: the aerial film plays inside the letters of the name, cut out of the solid green ground.
   Scrolling dives through the l of Tamala until the film fills the screen; it holds there with the headline, then leaves
   as a card with the projects sliding over it.
   The letters are real holes (an SVG mask), so the ground stays clean and their edges sharp, and a fine cream outline
   keeps the name readable whatever the film shows inside it; the outline goes as the dive begins. The dive narrows the
   SVG's viewBox around the l rather than scaling a picture of it, so the edges stay crisp all the way in. ---------- */
const clamp01 = v => Math.min(1, Math.max(0, v));
export function FilmHero({ word, title }) {
  const ready = useReady();
  const reduce = useReducedMotion();
  const phone = useMedia('(max-width: 899px)');
  const track = useRef(null), stage = useRef(null), video = useRef(null), svg = useRef(null), probe = useRef(null);
  const film = useFilm(video);
  const lines = phone ? word.split(' ') : [word];
  const [box, setBox] = useState(null);          // the name laid out in the stage's own pixels
  const geo = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: track, offset: ['start start', 'end end'] });
  const { scrollYProgress: q } = useScroll({ target: track, offset: ['end end', 'end start'] });
  // an even zoom (each step of scroll multiplies the depth by the same amount) through the first part of the hold
  const zoom = useTransform(p, v => (geo.current ? Math.pow(geo.current.max, clamp01(v / 0.7)) : 1));
  const fade = useTransform(p, [0.58, 0.72], [1, 0]);
  const edge = useTransform(p, [0, 0.14], [1, 0]);
  const cue = useTransform(p, [0, 0.08], [1, 0]);
  // while the film is only inside the letters it runs brighter, so dark scenes never empty them; it settles to its own
  // exposure as the dive opens it to the full screen
  const glow = useTransform(p, [0, 0.62], [0, 1]);
  const exposure = useTransform(glow, g => `brightness(${(1.45 - 0.45 * g).toFixed(3)}) contrast(${(0.9 + 0.1 * g).toFixed(3)})`);
  const card = useTransform(q, v => { const s = (v * 4).toFixed(2); return `inset(0% ${s}% 0% ${s}% round ${(v * 48).toFixed(1)}px)`; });
  const sink = useTransform(q, [0, 1], ['0%', '42%']);
  const dim = useTransform(q, [0, 1], [0, 0.55]);
  // the camera: depth s around the l's stem
  const aim = s => {
    const g = geo.current, el = svg.current;
    if (!g || !el) return;
    el.setAttribute('viewBox', `${(g.ax - g.ax / s).toFixed(2)} ${(g.ay - g.ay / s).toFixed(2)} ${(g.w / s).toFixed(2)} ${(g.h / s).toFixed(2)}`);
  };
  useMotionValueEvent(zoom, 'change', s => { if (!reduce) aim(s); });
  // lay the name out: sized to the width, centred a little above the middle, the l of Tamala found for the dive
  useLayoutEffect(() => {
    const el = stage.current, pr = probe.current;
    if (!el || !pr) return;
    const layout = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const gut = Math.min(80, Math.max(20, w * 0.055)), lh = 0.84;
      pr.setAttribute('font-size', '100');
      const widest = Math.max(...lines.map(l => { pr.textContent = l; return pr.getComputedTextLength(); })) || 1;
      let fs = (100 * (w - 2 * gut) * (phone ? 0.98 : 0.88)) / widest;
      fs = Math.min(fs, (h * 0.5) / (lines.length * lh));
      const top = h * (phone ? 0.42 : 0.46) - (lines.length * fs * lh) / 2;
      const ys = lines.map((_, i) => top + (i + 0.86) * fs * lh);
      pr.setAttribute('font-size', String(fs)); pr.textContent = lines[0];
      const len = pr.getComputedTextLength(), li = lines[0].indexOf('l');
      let ax = w / 2;
      if (li >= 0) { const ex = pr.getExtentOfChar(li); ax = w / 2 - len / 2 + ex.x + ex.width / 2; }
      const g = { w, h, fs, ys, ax, ay: ys[0] - fs * 0.34, max: Math.max(24, (Math.hypot(w, h) * 1.15) / (fs * 0.095)) };
      geo.current = g; setBox(g); aim(reduce ? 1 : zoom.get());
    };
    layout(); document.fonts?.ready.then(layout);
    const ro = new ResizeObserver(layout); ro.observe(el);
    return () => ro.disconnect();
  }, [phone, word]);   // eslint-disable-line react-hooks/exhaustive-deps
  let k = 0;
  return (
    <section className={`fhero${reduce ? ' is-still' : ''}`} ref={track} aria-labelledby="hero-h">
      <motion.div className="fhero__stage" ref={stage} style={reduce ? undefined : { clipPath: card, y: sink }}>
        <motion.video ref={video} className="fhero__film" muted loop playsInline preload="none" poster={film.poster} aria-hidden="true"
          style={{ filter: exposure }} />
        <motion.svg ref={svg} className="fhero__svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice" style={reduce ? undefined : { opacity: fade }}>
          <defs>
            <mask id="fhero-cut">
              {/* sized in the stage's own pixels with a wide margin: the dive's viewBox never leaves the stage, but percentages
                  would shrink with it */}
              {box && <rect x={-box.w} y={-box.h} width={box.w * 3} height={box.h * 3} fill="#fff" />}
              {box && lines.map((l, i) => (
                <text key={i} className="fhero__letters" x={box.w / 2} y={box.ys[i]} fontSize={box.fs} textAnchor="middle">
                  {l.split('').map((ch, j) => {
                    const d = 0.25 + 0.07 * k++;
                    // each letter develops: white in the mask (solid ground) to black (a window onto the film)
                    return <motion.tspan key={j} initial={{ fill: '#ffffff' }} animate={{ fill: ready ? '#000000' : '#ffffff' }} transition={{ duration: 0.9, ease: EASE, delay: d }}>{ch}</motion.tspan>;
                  })}
                </text>
              ))}
            </mask>
          </defs>
          {box ? <rect x={-box.w} y={-box.h} width={box.w * 3} height={box.h * 3} fill="#0f231d" mask="url(#fhero-cut)" />
               : <rect width="100%" height="100%" fill="#0f231d" />}
          {box && (
            <motion.g style={{ opacity: reduce ? 1 : edge }}>
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 1.2, ease: EASE, delay: 0.9 }}>
                {lines.map((l, i) => (
                  <text key={i} className="fhero__letters fhero__edge" x={box.w / 2} y={box.ys[i]} fontSize={box.fs} textAnchor="middle" vectorEffect="non-scaling-stroke">{l}</text>
                ))}
              </motion.g>
            </motion.g>
          )}
          <text ref={probe} className="fhero__letters" x="0" y="-2000" visibility="hidden" />
        </motion.svg>
        {!reduce && <motion.i className="hero__dim" aria-hidden="true" style={{ opacity: dim }} />}
        <PauseButton film={film} />
        <motion.div className="wrap fhero__foot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 20 }} transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}>
          <h1 className="fhero__title" id="hero-h">{title}</h1>
          <GlassCta />
        </motion.div>
        <motion.span className="hero__scroll" aria-hidden="true" style={{ opacity: cue }}><i />Scroll</motion.span>
      </motion.div>
    </section>
  );
}

/* ---------- hero: film or photograph over the whole first screen, the name set across its foot ---------- */
export function Hero({ word, title, film, image, alt, pos }) {
  const ready = useReady();
  const ref = useRef(null), video = useRef(null);
  const reduce = useReducedMotion();
  const phone = useMedia('(max-width: 1023px)');
  const [playing, setPlaying] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const lift = useTransform(scrollYProgress, [0, 1], ['0%', '-28%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  // as the page moves on, the hero draws in to a framed card with round corners, sinks slower than the page (so the next
  // section slides up over it) and dims
  const card = useTransform(scrollYProgress, v => { const s = (v * 4).toFixed(2); return `inset(0% ${s}% 0% ${s}% round ${(v * 48).toFixed(1)}px)`; });
  const sink = useTransform(scrollYProgress, [0, 1], ['0%', '42%']);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.55]);
  // the film loads after the first paint, never for visitors who asked for less motion or less data, nor on a slow
  // connection (3G or worse): there the still poster stays, and the play button still loads the film on request
  useEffect(() => {
    const v = video.current;
    if (!film || !v || !ready) return;
    const c = navigator.connection;
    const slow = c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ''));
    if (reduce || slow) return;
    v.src = phone ? BASE + '/media/hero-720p.mp4' : BASE + '/media/hero-1600.mp4';
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    const io = new IntersectionObserver(([e]) => { if (!v.dataset.paused) e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.1 });
    io.observe(v);
    return () => io.disconnect();
  }, [film, ready, reduce, phone]);
  const toggle = () => {
    const v = video.current;
    if (!v.src) { v.src = phone ? BASE + '/media/hero-720p.mp4' : BASE + '/media/hero-1600.mp4'; }
    if (v.paused) { delete v.dataset.paused; v.play().then(() => setPlaying(true)).catch(() => {}); } else { v.dataset.paused = '1'; v.pause(); setPlaying(false); }
  };
  return (
    <motion.section className="hero" ref={ref} aria-labelledby="hero-h" style={reduce ? undefined : { clipPath: card, y: sink }}>
      <motion.div className="hero__media" style={{ scale: reduce ? 1 : scale }} initial={{ scale: 1.18 }} animate={{ scale: ready ? 1 : 1.18 }} transition={{ duration: 2.2, ease: EASE }}>
        {film
          ? <video ref={video} muted loop playsInline preload="none" poster={phone ? BASE + '/media/hero-poster-720p.webp' : BASE + '/media/hero-poster-1600.webp'} aria-hidden="true" />
          : <img src={`${BASE}/media/img/${image}`} srcSet={srcSet(`${BASE}/media/img/${image}`)} sizes="100vw" alt={alt} style={{ objectPosition: pos }} fetchpriority="high" />}
      </motion.div>
      <div className="hero__shade" aria-hidden="true" />
      {!reduce && <motion.i className="hero__dim" aria-hidden="true" style={{ opacity: dim }} />}
      {film && (
        <button className="hero__pause" type="button" onClick={toggle} aria-label={playing ? 'Pause the film' : 'Play the film'} data-cursor={playing ? 'Pause' : 'Play'}>
          {playing ? <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" /></svg> : <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2v10l8-5z" /></svg>}
        </button>
      )}
      <motion.div className="wrap hero__foot" style={{ y: reduce ? 0 : lift, opacity: reduce ? 1 : fade }}>
        <p className="hero__word" aria-hidden="true" style={{ '--n': word.length }}>
          {word.split('').map((ch, i) => (
            <span className="w" key={i}><motion.span className="w__in" initial={{ y: '105%' }} animate={{ y: ready ? '0%' : '105%' }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.25 + 0.035 * i }}>{ch === ' ' ? ' ' : ch}</motion.span></span>
          ))}
        </p>
        <h1 className="sr-only" id="hero-h">{title}</h1>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 20 }} transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}>
          <GlassCta />
        </motion.div>
      </motion.div>
      <motion.span className="hero__scroll" aria-hidden="true" style={{ opacity: fade }}><i />Scroll</motion.span>
    </motion.section>
  );
}

/* ---------- a 3D stage: poster first, the live view when it nears the screen ---------- */
export function Viz({ kind, poster, alt, what, load, onView, mode, cursor = 'Drag' }) {
  const ref = useRef(null), view = useRef(null), cb = useRef(onView);
  cb.current = onView;
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!webglOK()) return;
    let dead = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      load(ref.current).then(v => { if (dead) { v.dispose(); return; } view.current = v; cb.current(v); })
        .catch(err => console.error('[tamala] 3D view did not start:', err));
    }, { rootMargin: '600px 0px' });
    io.observe(ref.current);
    return () => { dead = true; io.disconnect(); if (view.current) { view.current.dispose(); view.current = null; cb.current(null); } };
  }, [load]);
  const turn = d => { setTouched(true); view.current && view.current.turn(d); };
  return (
    <motion.div className={`viz${touched ? ' is-touched' : ''}`} ref={ref} data-viz={kind} data-mode={mode} data-cursor={mode === 'layout' ? undefined : cursor}
      onPointerDown={() => setTouched(true)}
      initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 1, ease: EASE }}>
      <img className="viz__poster" src={poster} alt={alt} loading="lazy" />
      <span className="viz__hint" aria-hidden="true">Drag to turn</span>
      <div className="viz__turn">
        <button type="button" onClick={() => turn(-0.6)} aria-label={`Turn the ${what} left`}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg></button>
        <button type="button" onClick={() => turn(0.6)} aria-label={`Turn the ${what} right`}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg></button>
      </div>
    </motion.div>
  );
}

/* ---------- section heading ---------- */
export function Head({ id, parts, text, lead, chapter }) {
  return (
    <div className="head">
      {chapter && <Chapter n={chapter[0]}>{chapter[1]}</Chapter>}
      <Words as="h2" id={id} parts={parts} text={text} />
      {lead && <Rise as="p" delay={0.15}>{lead}</Rise>}
    </div>
  );
}

/* ---------- the visit form: it opens the visitor's email app with the request filled in ---------- */
export function Visit({ project, heading, lead, photo, spot, chapter }) {
  const [v, setV] = useState({ name: '', phone: '', project: project || 'Arundelpet', date: '' });
  const [err, setErr] = useState({}); const [sent, setSent] = useState(false);
  const set = k => e => { setV(s => ({ ...s, [k]: e.target.value })); setErr(s => ({ ...s, [k]: undefined })); };
  const check = (k, val) => k === 'name' ? (val.trim().length < 2 && 'Write the name we should ask for when we call.')
    : k === 'phone' ? (val.replace(/\D/g, '').length < 10 && 'Write a 10 digit mobile number so we can call you.')
    : k === 'date' ? (!val && 'Choose the day you want to visit.') : false;
  // feedback while filling in, not only on submit: a field that was touched and left wrong says so at once
  const blur = k => e => { const m = e.target.value ? check(k, e.target.value) : false; setErr(s => ({ ...s, [k]: m || undefined })); };
  const submit = e => {
    e.preventDefault();
    const er = {};
    for (const k of ['name', 'phone', 'date']) { const m = check(k, v[k]); if (m) er[k] = m; }
    setErr(er);
    if (Object.keys(er).length) { const first = e.currentTarget.querySelector(`[name="${Object.keys(er)[0]}"]`); first && first.focus(); return; }
    // the request goes out as a WhatsApp message, filled in and ready to send: that's how most families here reach us
    // (an email app is often not set up on a phone); email stays as a link under the button
    const day = new Date(v.date + 'T12:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = `Hello Tamala Homes, I would like to book a site visit.\nName: ${v.name}\nPhone: ${v.phone}\nProject: ${v.project}\nDay: ${day}`;
    const w = window.open(wa(msg), '_blank', 'noopener');
    if (!w) window.location.href = wa(msg);
    setSent(true); tick();
  };
  const field = (k, label, props) => (
    <div className={`field${err[k] ? ' has-error' : ''}${v[k] ? ' is-filled' : ''}`}>
      <label htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} name={k} value={v[k]} onChange={set(k)} onBlur={blur(k)} aria-invalid={!!err[k]} aria-describedby={err[k] ? `f-${k}-err` : undefined} {...props} />
      <AnimatePresence>{err[k] && <motion.p className="field__error" id={`f-${k}-err`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{err[k]}</motion.p>}</AnimatePresence>
    </div>
  );
  const brochure = project ? Object.values(PAGES).find(p => p.short === project).key : 'tamala-homes';
  const days = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const x = new Date(); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + i);
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    return { iso, week: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : x.toLocaleDateString('en-IN', { weekday: 'short' }), day: x.getDate(), month: x.toLocaleDateString('en-IN', { month: 'short' }) };
  }), []);
  return (
    <section className="section section--surface" id="visit" aria-labelledby="visit-h">
      <div className={spot ? 'wrap has-spot' : 'wrap'}>{spot && <Spot shape={spot} />}
        <Head id="visit-h" text={heading} lead={lead} chapter={chapter} />
        <div className="split">
          <Rise as="form" className="form" onSubmit={submit} noValidate>
            {field('name', 'Name', { type: 'text', autoComplete: 'name' })}
            {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
            {!project && (
              <div className="field is-filled">
                <label htmlFor="f-project">Project</label>
                <select id="f-project" name="project" value={v.project} onChange={set('project')}>{ORDER.map(k => <option key={k}>{PAGES[k].short}</option>)}</select>
              </div>
            )}
            {/* the next twelve days as a row of choices (real radio buttons: arrow keys move between them) */}
            <fieldset className={`field field--days${err.date ? ' has-error' : ''}`}>
              <legend>Day of the visit</legend>
              <div className="days">
                {days.map(d => (
                  <label key={d.iso} className={`day${v.date === d.iso ? ' is-on' : ''}`}>
                    <input type="radio" name="date" value={d.iso} checked={v.date === d.iso} onChange={set('date')}
                      aria-describedby={err.date ? 'f-date-err' : undefined} />
                    <span className="day__w">{d.week}</span><span className="day__d">{d.day}</span><span className="day__m">{d.month}</span>
                  </label>
                ))}
              </div>
              <AnimatePresence>{err.date && <motion.p className="field__error" id="f-date-err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{err.date}</motion.p>}</AnimatePresence>
            </fieldset>
            <div className="form__foot">
              <Magnetic pull={0.18}><button className="btn btn--solid btn--lg" type="submit">Book a site visit<Arrow /></button></Magnetic>
              <p className="form__note" role="status">{sent ? 'WhatsApp opens with your request filled in. Send it and we call you within a day.' : 'Opens WhatsApp with your request filled in. We call you within a day to fix the time.'}</p>
              <p className="form__note">Rather use email? <a className="link" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('Site visit request: ' + v.project)}&body=${encodeURIComponent(`Name: ${v.name}\nPhone: ${v.phone}\nProject: ${v.project}\nDay of the visit: ${v.date}`)}`}>Send it by email</a></p>
            </div>
          </Rise>
          <div className="visit__side">
            <Picture className="visit__photo" src={`${BASE}/media/img/${photo[0]}`} alt={photo[1]} />
            <div className="actions">
              {[['Chat on WhatsApp', wa(project ? `Hello, I would like to know more about Tamala ${project}.` : 'Hello, I would like to visit a Tamala Homes project.')],
                ['Call the sales office', `tel:${CONTACT.phone}`],
                ['Download the brochure', `${BASE}/brochures/${brochure}.pdf`]].map(([l, h], i) => (
                <Rise as="a" key={l} delay={0.08 * i} className="action" href={h} download={l.startsWith('Download') ? true : undefined}>{l}<Arrow /></Rise>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
// the close of every page: the invitation, the office and its hours, then the name set across a photograph of towers at
// dusk, its letters rising in as it arrives. A dark footer after a light section rises in on a curved edge (Dome).
export function Footer({ under = 'var(--surface)' }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const lift = useTransform(scrollYProgress, [0, 1], ['-14%', '0%']);
  const foot = (
    <footer className="foot" id="contact">
      <div className="wrap">
        <div className="foot__top">
          <div>
            <Words as="h2" text="See a flat *before* you decide" />
            <Rise as="p" delay={0.2}>We drive you to the site, walk you through a finished flat and show you the papers.</Rise>
          </div>
          <Rise delay={0.3}><GlassCta /></Rise>
        </div>
        <div className="foot__cols">
          <Rise className="foot__col foot__col--office">
            <h3>Sales office</h3>
            <address>Brodipet, Guntur</address>
            <p className="foot__te" lang="te">తమల హోమ్స్, గుంటూరు</p>
            <p><a className="link" href={gmaps('Brodipet, Guntur, Andhra Pradesh')} target="_blank" rel="noopener">Open in Google Maps<Arrow /></a></p>
          </Rise>
          <Rise className="foot__col" delay={0.08}>
            <h3>Sales office hours</h3>
            <dl className="hours">{HOURS.map(([d, t]) => <div key={d}><dt>{d}</dt><dd>{t}</dd></div>)}</dl>
          </Rise>
          <Rise className="foot__col" delay={0.16}>
            <h3>Projects</h3>
            <ul>{ORDER.map(k => <li key={k}><Link to={`/projects/${k}`}>{PAGES[k].short}</Link></li>)}</ul>
          </Rise>
          <Rise className="foot__col" delay={0.24}>
            <h3>Talk to us</h3>
            <ul>
              <li><a href={wa('Hello, I would like to visit a Tamala Homes project.')}>Chat on WhatsApp</a></li>
              <li><a href={`tel:${CONTACT.phone}`}>Call the sales office</a></li>
              <li><a href={BASE + "/brochures/tamala-homes.pdf"} download>Download the brochure</a></li>
            </ul>
          </Rise>
        </div>
      </div>
      <div className="foot__stage" ref={ref}>
        <motion.img className="foot__photo" src={`${BASE}/media/img/evening-towers.webp`} srcSet={srcSet(`${BASE}/media/img/evening-towers.webp`)} sizes="100vw"
          alt="" aria-hidden="true" loading="lazy" style={{ y: reduce ? 0 : lift }} />
        <p className="foot__word" aria-hidden="true">
          {'Tamala Homes'.split('').map((ch, i) => (
            <span className="w" key={i}><motion.span className="w__in" initial={reduce ? false : { y: '104%' }} animate={{ y: seen || reduce ? '0%' : '104%' }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.035 * i }}>{ch === ' ' ? '\u00a0' : ch}</motion.span></span>
          ))}
        </p>
        <div className="wrap foot__legal">
          <span>&copy; 2026 Tamala Homes</span>
          <span><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/credits">Photographs and film via Pexels</Link></span>
        </div>
      </div>
    </footer>
  );
  return under ? <Dome under={under}>{foot}</Dome> : foot;
}

export { gmaps, wa };
