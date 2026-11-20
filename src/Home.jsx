// Home: film hero, a pinned horizontal run through the three projects, the 3D map, the promise,
// the four build stages, amenities, the visit form.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useReducedMotion, LayoutGroup } from 'framer-motion';
import { Link, BASE, Words, Rise, Picture, Counter, Arrow, EASE, SPRING, useMedia } from './lib.jsx';
import { Nav, Hero, Head, Visit, Footer, gmaps } from './components.jsx';
import { PROJECTS, MAP } from './data.js';
import { PAGES, ORDER, STAGES, AMENITIES } from './content.js';
import { Dial } from './Dial.jsx';

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
  return (
    <section className={`projects${pin ? ' is-pinned' : ''}`} id="projects" ref={ref} aria-labelledby="projects-h">
      <div className="projects__sticky">
        <motion.div className="projects__track" ref={track} style={{ x: pin ? x : 0 }}>
          <div className="projects__intro">
            <Words as="h2" id="projects-h" parts={[{ t: 'Three projects in Guntur.' }, { t: 'One ready, one rising, one about to open.', muted: true }]} />
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
                <Picture className="pcard__pic" src={`${BASE}/media/img/${p.cardImg}`} alt={p.cardAlt} pos={p.cardPos} strength={pin ? 0 : 6} />
                <div className="pcard__text">
                  <Rise as="span" className="chip" delay={0.1}>{p.status}</Rise>
                  <Words as="h3" text={p.short} delay={0.1} />
                  <Rise as="p" delay={0.25}>{p.card}</Rise>
                  <Rise as="span" className="pcard__go" delay={0.35}>View {p.short}<Arrow /></Rise>
                </div>
              </Link>
            );
          })}
        </motion.div>
        {pin && <div className="projects__bar" aria-hidden="true"><motion.i style={{ scaleX: scrollYProgress }} /></div>}
      </div>
    </section>
  );
}

/* ---------- map: pick a project, see its drive times on the dial, point at a place to light its spoke ---------- */
function MapSection() {
  const [sel, setSel] = useState('arundelpet');
  const [hot, setHot] = useState(-1);
  const p = PAGES[sel];
  return (
    <section className="section section--surface" id="map" aria-labelledby="map-h">
      <div className="wrap">
        <Head id="map-h" text="Where we build in Guntur" lead="Pick a project to see how far it is from the places you drive to every week." />
        <div className="split split--viz">
          <div className="panel">
            <LayoutGroup>
              <ul className="picks">
                {ORDER.map((k, i) => (
                  <Rise as="li" key={k} delay={0.07 * i}>
                    <button type="button" aria-pressed={sel === k} onClick={() => setSel(k)}>
                      {sel === k && <motion.i layoutId="pick-dot" className="picks__dot" transition={SPRING} />}
                      <span>{PAGES[k].short}</span><small>{PAGES[k].status}</small>
                    </button>
                  </Rise>
                ))}
              </ul>
            </LayoutGroup>
            <ul className="rows rows--hover" onMouseLeave={() => setHot(-1)}>
              {MAP.landmarks.map((l, i) => (
                <Rise as="li" key={l.name} delay={0.05 * i} className={hot === i ? 'is-on' : undefined} tabIndex={0}
                  onMouseEnter={() => setHot(i)} onFocus={() => setHot(i)} onClick={() => setHot(i)}>
                  <span>{l.name}</span>
                  <span className="num"><AnimatePresence mode="popLayout" initial={false}>
                    <motion.b key={sel} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35 }}>{l.min[sel]} min</motion.b>
                  </AnimatePresence></span>
                </Rise>
              ))}
            </ul>
            <p className="links">
              <Link className="link" to={`/projects/${sel}`}>See {p.short}<Arrow /></Link>
              <a className="link" href={gmaps(`${p.place}, Guntur, Andhra Pradesh`)} target="_blank" rel="noopener">Open in Google Maps<Arrow /></a>
            </p>
          </div>
          <Dial sel={sel} setSel={setSel} hot={hot} setHot={setHot} />
        </div>
      </div>
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
    <section className="section section--dark promise" id="promise" aria-label="Our promise">
      <div className="wrap">
        <Rise as="p" className="label">How we hand over</Rise>
        <p className="promise__text" ref={ref} aria-label={PROMISE.join(' ')}>
          {PROMISE.map((w, i) => {
            const strong = i >= STRONG[0] && i <= STRONG[1];
            return reduce
              ? <span key={i} className={strong ? 'is-strong' : undefined}>{w} </span>
              : <span key={i} className={strong ? 'is-strong' : undefined} aria-hidden="true"><Lit progress={scrollYProgress} i={i} n={PROMISE.length}>{w}</Lit></span>;
          })}
        </p>
        <Picture className="promise__pic" src={BASE + "/media/img/living-warm.webp"} alt="A finished living room with a white sofa, wood panelling and a dining table by the window" pos="50% 60%" strength={10} />
      </div>
    </section>
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
      <img className="stages__inline" src={`${BASE}/media/img/${s[2]}`} alt={s[3]} loading="lazy" />
    </motion.li>
  );
}
function Stages() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.5', 'end 0.5'] });
  const on = useCallback(i => setActive(i), []);
  return (
    <section className="section section--surface" id="build" aria-labelledby="build-h">
      <div className="wrap">
        <Head id="build-h" text="Four stages from booking to keys" />
        <div className="stages">
          <div className="stages__sticky">
            <div className="stages__count num" aria-hidden="true">
              <span className="w"><AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={active} className="w__in" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '-100%' }} transition={{ duration: 0.5, ease: EASE }}>0{active + 1}</motion.span>
              </AnimatePresence></span><i>/ 04</i>
            </div>
            <div className="stages__pics">
              {STAGES.map((s, i) => (
                <motion.img key={s[2]} src={`${BASE}/media/img/${s[2]}`} alt={i === active ? s[3] : ''} loading="lazy"
                  animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.1 }} transition={{ duration: 0.9, ease: EASE }} />
              ))}
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
  const [a, setA] = useState(0);
  return (
    <section className="section" id="amenities" aria-labelledby="amenities-h">
      <div className="wrap">
        <Head id="amenities-h" text="Pools, clubhouse and play areas" lead="Shared spaces on the ground and the terrace, kept by our own maintenance team for the first two years." />
        <div className="split">
          <ul className="amen">
            {AMENITIES.map((m, i) => (
              <Rise as="li" key={m[0]} delay={0.06 * i}>
                <button type="button" aria-pressed={a === i} onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onClick={() => setA(i)}>
                  <span className="amen__name">{m[0]}</span>
                  <motion.span className="amen__text" initial={false} animate={{ height: a === i ? 'auto' : 0, opacity: a === i ? 1 : 0 }} transition={SPRING}>
                    <span>{m[1]}</span>
                  </motion.span>
                </button>
              </Rise>
            ))}
          </ul>
          <Rise className="amen__pics">
            <AnimatePresence initial={false}>
              <motion.img key={a} src={`${BASE}/media/img/${AMENITIES[a][2]}`} alt={AMENITIES[a][3]}
                initial={{ clipPath: 'inset(0% 0% 100% 0%)', scale: 1.12 }} animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }} exit={{ opacity: 0.6 }}
                transition={{ duration: 0.9, ease: EASE }} />
            </AnimatePresence>
          </Rise>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => { document.title = 'Tamala Homes: 2 and 3 BHK apartments in Guntur'; }, []);
  return (
    <>
      <Nav links={LINKS} />
      <main id="main">
        <Hero film word="Tamala Homes" title="2 and 3 BHK apartments in Guntur" />
        <Projects />
        <MapSection />
        <Promise_ />
        <Stages />
        <Amenities />
        <Visit heading="Site visits, seven days a week" lead="Tell us the project and a day. We call to confirm a time and send a car from the office in Brodipet."
          photo={['city-view.webp', 'A bright flat with a breakfast counter and a window onto apartment towers']} />
      </main>
      <Footer />
    </>
  );
}
