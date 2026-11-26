// Home: film hero, a pinned horizontal run through the three projects, the 3D map, the promise,
// the four build stages, amenities, the visit form.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useReducedMotion, useMotionValueEvent, LayoutGroup } from 'framer-motion';
import { Link, BASE, Words, Rise, Picture, Counter, Arrow, Tilt, EASE, SPRING, useMedia, srcSet, useNear } from './lib.jsx';
import { Nav, FilmHero, Head, Visit, Footer, gmaps } from './components.jsx';
import { PROJECTS, MAP } from './data.js';
import { PAGES, ORDER, STAGES, AMENITIES } from './content.js';
import { Orb, Spot } from './Orb.jsx';
import { Dome, Leaf, Marquee, Giant, Chapter } from './fx.jsx';
import { scrollToY } from './smooth.js';

const LINKS = [['Projects', '#projects'], ['Locations', '#map'], ['Building', '#build'], ['Amenities', '#amenities']];
const TOWERS = Object.values(PROJECTS).reduce((a, p) => a + p.towers.length, 0);
const FLATS = Object.values(PROJECTS).reduce((a, p) => a + p.towers.length * p.floors * p.perFloor, 0);

/* ---------- projects: the page holds still while the three projects pass sideways ---------- */
function Projects() {
  const ref = useRef(null), track = useRef(null);
  const wide = useMedia('(min-width: 1024px)');
  const reduce = useReducedMotion();
  const pin = wide && !reduce;
  const [dist, setDist] = useState(0);
  useLayoutEffect(() => {
    if (!pin) return;
    const f = () => setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
    f(); window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [pin]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, v => -v * dist);
  // which card leads the run, for the counter beside the progress line
  const [card, setCard] = useState(1);
  useMotionValueEvent(scrollYProgress, 'change', v => setCard(Math.min(ORDER.length, 1 + Math.floor(v * ORDER.length * 0.999))));
  // the run moves sideways only as the page scrolls, so a card reached with Tab could sit off the screen: scroll the
  // page to where that card stands at the left edge (the frame's own sideways jump is undone in onScroll below)
  const onFocus = e => {
    if (!pin) return;
    const card = e.target.closest('.pcard, .projects__intro'), sec = ref.current;
    if (!card || !sec) return;
    const gut = parseFloat(getComputedStyle(track.current).paddingLeft) || 0;
    const p = Math.min(1, Math.max(0, (card.offsetLeft - gut) / (dist || 1)));
    // a moment later, so the browser's own scroll-into-view on focus has run and doesn't cancel this one
    setTimeout(() => {
      const top = sec.getBoundingClientRect().top + scrollY;
      scrollToY(top + p * (sec.offsetHeight - innerHeight), { immediate: !!reduce });
    }, 0);
  };
  return (
    <section className={`projects${pin ? ' is-pinned' : ''}`} id="projects" ref={ref} aria-labelledby="projects-h">
      {/* the frame clips the run and never scrolls itself; a browser scrolling it to show a focused card is put back */}
      <div className="projects__sticky" onScroll={e => { if (e.currentTarget.scrollLeft) e.currentTarget.scrollLeft = 0; }}>
        <motion.div className="projects__track" ref={track} style={{ x: pin ? x : 0 }} onFocus={onFocus}>
          <div className="projects__intro">
            <div>
            <Chapter n={1}>Projects</Chapter>
            <Words as="h2" id="projects-h" parts={[{ t: 'Three projects in *Guntur.*' }, { t: 'One ready, one rising, one about to open.', muted: true }]} />
            </div>
            <dl className="stats">
              <Rise delay={0.1}><dd><Counter to={3} /></dd><dt>Projects</dt></Rise>
              <Rise delay={0.2}><dd><Counter to={TOWERS} /></dd><dt>Towers</dt></Rise>
              <Rise delay={0.3}><dd><Counter to={FLATS} /></dd><dt>Flats</dt></Rise>
            </dl>
          </div>
          {ORDER.map((k, i) => {
            const p = PAGES[k];
            return (
              <Link key={k} className="pcard" to={`/projects/${k}`} data-cursor="View">
                <Tilt className="pcard__body">
                  <Picture className="pcard__pic" src={`${BASE}/media/img/${p.cardImg}`} alt={p.cardAlt} pos={p.cardPos} sizes="(max-width: 1023px) 100vw, 54vw" strength={pin ? 0 : 6} />
                  <div className="pcard__text">
                    <Rise as="span" className="pcard__n num" aria-hidden="true" delay={0.05}>{String(i + 1).padStart(2, '0')}</Rise>
                    <Rise as="span" className="chip" delay={0.1}>{p.status}</Rise>
                    <Words as="h3" text={p.short} delay={0.1} />
                    <Rise as="p" delay={0.25}>{p.card}</Rise>
                    <Rise as="span" className="pcard__go" delay={0.35}>View {p.short}<Arrow /></Rise>
                  </div>
                </Tilt>
              </Link>
            );
          })}
        </motion.div>
        {pin && (
          <div className="projects__bar" aria-hidden="true">
            <motion.i style={{ scaleX: scrollYProgress }} />
            <span className="projects__count num"><b>{String(card).padStart(2, '0')}</b> / {String(ORDER.length).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- map: a tab per project over a Google map; pick a landmark to see the route there ---------- */
const enc = encodeURIComponent;
const inGuntur = q => `${q}, Guntur, Andhra Pradesh`;
function MapSection() {
  const [sel, setSel] = useState('arundelpet');
  const [to, setTo] = useState(-1);
  const p = PAGES[sel], from = inGuntur(p.place);
  const dest = to >= 0 ? MAP.landmarks[to] : null;
  const src = dest
    ? `https://www.google.com/maps?saddr=${enc(from)}&daddr=${enc(inGuntur(dest.name))}&output=embed`
    : `https://www.google.com/maps?q=${p.ll}&z=15&output=embed`;
  const box = useRef(null), near = useNear(box);
  const pick = k => { setSel(k); setTo(-1); };
  const tabKeys = e => {
    const i = ORDER.indexOf(sel), n = ORDER.length;
    const j = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault(); pick(ORDER[j]); document.getElementById(`map-tab-${ORDER[j]}`).focus();
  };
  const route = i => setTo(t => (t === i ? -1 : i));
  return (
    <section className="section section--surface" id="map" aria-labelledby="map-h">
      <div className="wrap has-spot"><Spot shape="pin" />
        <Head id="map-h" chapter={[2, 'Locations']} text="Where we build in *Guntur*" lead="Choose a project, then a place you drive to every week to see the way there." />
        <div className="split split--viz split--map">
          <div className="panel">
            <p className="map__from">Drive times from <AnimatePresence mode="popLayout" initial={false}>
              <motion.b key={sel} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.3 }}>{p.short}</motion.b>
            </AnimatePresence></p>
            <ul className="rows rows--hover rows--route">
              {MAP.landmarks.map((l, i) => (
                <Rise as="li" key={l.name} delay={0.05 * i} className={to === i ? 'is-on' : undefined}>
                  <button type="button" className="rows__btn" aria-pressed={to === i} onClick={() => route(i)}>
                  <span>{l.name}</span>
                  <span className="num"><AnimatePresence mode="popLayout" initial={false}>
                    <motion.b key={sel} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35 }}>{l.min[sel]} min</motion.b>
                  </AnimatePresence><i className="rows__go" aria-hidden="true"><Arrow /></i></span>
                  </button>
                </Rise>
              ))}
            </ul>
            <p className="links">
              <Link className="link" to={`/projects/${sel}`}>See {p.short}<Arrow /></Link>
              <a className="link" href={dest ? `https://www.google.com/maps/dir/?api=1&origin=${enc(from)}&destination=${enc(inGuntur(dest.name))}` : gmaps(from)} target="_blank" rel="noopener">
                {dest ? 'Open this route in Google Maps' : 'Open in Google Maps'}<Arrow /></a>
            </p>
          </div>
          <div className="mapcard">
            <LayoutGroup id="map-tabs">
              {/* real tabs: one Tab stop, the arrow keys (and Home, End) move between projects and choose as they go */}
              <div className="seg mapcard__tabs" role="tablist" aria-label="Projects" onKeyDown={tabKeys}>
                {ORDER.map(k => (
                  <button key={k} id={`map-tab-${k}`} type="button" role="tab" aria-selected={sel === k} aria-controls="map-panel"
                    tabIndex={sel === k ? 0 : -1} onClick={() => pick(k)}>
                    {sel === k && <motion.i layoutId="map-tab" className="seg__thumb" transition={SPRING} />}
                    <span>{PAGES[k].short}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <div className="gmap mapcard__map" ref={box} id="map-panel" role="tabpanel" aria-labelledby={`map-tab-${sel}`}>
              <AnimatePresence initial={false}>
                {near && <motion.iframe key={src} src={src} title={dest ? `Google map: the way from ${p.short} to ${dest.name}` : `Google map of ${p.place}, Guntur`}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen
                  initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.6 } }} />}
              </AnimatePresence>
            </div>
            <div className="mapcard__note">
              <AnimatePresence mode="wait" initial={false}>
                {dest
                  ? <motion.p key={`r${to}${sel}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      The way to <b>{dest.name}</b>, about {dest.min[sel]} min by car.{' '}
                      <button type="button" className="link" onClick={() => setTo(-1)}>Back to {p.short}</button></motion.p>
                  : <motion.p key="hint" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>Pick a place in the list to see the way there.</motion.p>}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {/* the city's name across the whole width: the close of the map, and the ground the promise rises out of */}
      <Giant text="Guntur" />
    </section>
  );
}

/* ---------- the promise: each word lights as the page moves ---------- */
const PROMISE = 'We build only in Guntur. Every flat is handed over with its approved plan, its title papers and one person at our office who answers your calls until the last key is given.'.split(' ');
const STRONG = [18, 22];   // "one person at our office"
function Lit({ progress, i, n, children }) {
  const opacity = useTransform(progress, [i / n, (i + 1.5) / n], [0.22, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}
function Promise_() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.82', 'start 0.18'] });
  return (
    <Dome under="var(--surface)">
    <section className="section section--dark promise" id="promise" aria-label="Our promise">
      <div className="wrap has-spot"><Spot shape="ring" />
        <Chapter n={3}>How we hand over</Chapter>
        {/* screen readers get the sentence whole; the word-by-word copy is only for the eye */}
        <p className="promise__text" ref={ref}>
          <span className="sr-only">{PROMISE.join(' ')}</span>
          {PROMISE.map((w, i) => {
            const strong = i >= STRONG[0] && i <= STRONG[1];
            return reduce
              ? <span key={i} className={strong ? 'is-strong' : undefined} aria-hidden="true">{w} </span>
              : <span key={i} className={strong ? 'is-strong' : undefined} aria-hidden="true"><Lit progress={scrollYProgress} i={i} n={PROMISE.length}>{w}</Lit></span>;
          })}
        </p>
      </div>
      {/* the handover, pictured: a finished living room opening out of the Tamala leaf */}
      <Leaf src={BASE + "/media/img/living-warm.webp"} alt="A finished living room with a white sofa, wood panelling and a dining table by the window" pos="50% 60%" />
    </section>
    </Dome>
  );
}

/* ---------- four stages: the picture and the number hold while the steps pass ---------- */
function Stage({ i, s, active, onActive }) {
  const ref = useRef(null);
  const mid = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => { if (mid) onActive(i); }, [mid, i, onActive]);
  return (
    <motion.li ref={ref} animate={{ opacity: active ? 1 : 0.32 }} transition={{ duration: 0.4 }}>
      <span className="stages__n num">0{i + 1}</span>
      <h3>{s[0]}</h3>
      <p>{s[1]}</p>
      <img className="stages__inline" src={`${BASE}/media/img/${s[2]}`} srcSet={srcSet(`${BASE}/media/img/${s[2]}`)} sizes="100vw" alt={s[3]} loading="lazy" />
    </motion.li>
  );
}
function Stages() {
  const [{ active, prev }, setStage] = useState({ active: 0, prev: 0 });   // the stage on show and the one it replaced
  const ref = useRef(null);
  const down = active >= prev;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.5', 'end 0.5'] });
  const on = useCallback(i => setStage(x => (x.active === i ? x : { active: i, prev: x.active })), []);
  return (
    <section className="section section--surface" id="build" aria-labelledby="build-h">
      <div className="wrap has-spot"><Spot shape="brick" />
        <Head id="build-h" chapter={[4, 'Building']} text="Four stages from *booking* to *keys*" />
        <div className="stages">
          <div className="stages__sticky">
            <div className="stages__count num" aria-hidden="true">
              <span className="w"><AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={active} className="w__in" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} transition={{ duration: 0.5, ease: EASE }}>0{active + 1}</motion.span>
              </AnimatePresence></span><i>/ 04</i>
            </div>
            <div className="stages__pics">
              {/* never a blend: the new picture wipes in over the one before it (from below going down, from above going up);
                  only those two are ever on screen, however fast the scroll */}
              {STAGES.map((s, i) => {
                const on = i === active, under = i === prev && !on;
                return (
                  <motion.img key={s[2]} src={`${BASE}/media/img/${s[2]}`} srcSet={srcSet(`${BASE}/media/img/${s[2]}`)} sizes="50vw" alt={on ? s[3] : ''} loading="lazy"
                    style={{ zIndex: on ? 2 : under ? 1 : 0, visibility: on || under ? 'visible' : 'hidden' }}
                    initial={false}
                    animate={on ? { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 } : { clipPath: down ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', scale: 1.08 }}
                    transition={on ? { duration: 0.85, ease: EASE } : { duration: 0 , delay: 0.85 }} />
                );
              })}
            </div>
          </div>
          <div className="stages__steps" ref={ref}>
            <div className="stages__line" aria-hidden="true"><motion.i style={{ scaleY: scrollYProgress }} /></div>
            <ol>{STAGES.map((s, i) => <Stage key={s[0]} i={i} s={s} active={i === active} onActive={on} />)}</ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- amenities: a list that swaps the picture beside it ---------- */
function Amenities() {
  // four round photos roll in from the right once, each turning upright as it lands; names stay level and readable
  return (
    <section className="section amenities" id="amenities" aria-labelledby="amenities-h">
      <div className="wrap has-spot"><Spot shape="sun" />
        <Head id="amenities-h" chapter={[5, 'Amenities']} text="Pools, clubhouse and *play areas*" lead="Shared spaces on the ground and the terrace, kept by our own maintenance team for the first two years." />
        <motion.ul className="roll" initial="away" whileInView="here" viewport={{ once: true, margin: '0px 0px -20% 0px' }}>
          {AMENITIES.map((m, i) => (
            <li key={m[0]} className="roll__item">
              <motion.div className="roll__disc"
                variants={{ away: { x: '70vw', rotate: 220 }, here: { x: 0, rotate: 0 } }}
                transition={{ duration: 1.5 + 0.1 * i, delay: 0.12 * i, ease: [0.16, 0.8, 0.24, 1] }}>
                <img src={`${BASE}/media/img/${m[2]}`} srcSet={srcSet(`${BASE}/media/img/${m[2]}`)} sizes="(max-width: 1023px) 72vw, 25vw" alt={m[3]} loading="lazy" draggable={false} />
              </motion.div>
              <motion.div className="roll__text"
                variants={{ away: { opacity: 0, y: 16 }, here: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, delay: 1.1 + 0.14 * i, ease: EASE }}>
                <h3>{m[0]}</h3>
                <p>{m[1]}</p>
              </motion.div>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => { document.title = 'Tamala Homes: 2 and 3 BHK apartments in Guntur'; }, []);
  return (
    <>
      <Nav links={LINKS} />
      <Orb />
      <main id="main">
        <FilmHero word="Tamala Homes" title="2 and 3 BHK apartments in Guntur" />
        <Projects />
        <MapSection />
        <Promise_ />
        <Stages />
        <Marquee words={['Lap pool', 'Clubhouse', 'Garden pavilion', 'Play area', 'Terrace garden', 'Gym']} />
        <Amenities />
        <Visit spot="target" chapter={[6, 'Visit']} heading="Site visits, *seven days* a week" lead="Tell us the project and a day. We call to confirm a time and send a car from the office in Brodipet."
          photo={['city-view.webp', 'A bright flat with a breakfast counter and a window onto apartment towers']} />
      </main>
      <Footer />
    </>
  );
}
