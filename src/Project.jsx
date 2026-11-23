// One project: photograph hero, overview, 3D availability, 3D floor plans, gallery with a lightbox,
// Google map, construction progress (when building), the visit form, and the way to the other projects.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from 'framer-motion';
import { Link, BASE, Words, Rise, Picture, Counter, Arrow, EASE, SPRING, FLICK, project, tick } from './lib.jsx';
import { Nav, Hero, Viz, Head, Visit, Footer, gmaps, wa } from './components.jsx';
import { PROJECTS, PLANS, MAP, STATUS, flatsFor } from './data.js';
import { PAGES, ORDER } from './content.js';

const LINKS = [['All projects', '/#projects'], ['Availability', '#availability'], ['Floor plans', '#plans'], ['Location', '#location']];
const ASSUMED = new Set(['Sizes', 'Handover', 'Allotments', 'Flats', 'Tower', 'Towers']);

function Seg({ label, value, onChange, options }) {
  return (
    <LayoutGroup id={label}>
      <div className="seg" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {value === v && <motion.i layoutId="seg-thumb" className="seg__thumb" transition={{ type: 'spring', bounce: 0, duration: 0.32 }} />}
            <span>{l}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/* ---------- availability ---------- */
function Availability({ page }) {
  const proj = PROJECTS[page.key];
  const flats = useMemo(() => flatsFor(page.key), [page.key]);
  const byId = useMemo(() => new Map(flats.map(f => [f.id, f])), [flats]);
  const first = useMemo(() => ([...flats].reverse().find(f => f.status === 'available' && f.bhk === 3) || flats[flats.length - 1]).id, [flats]);
  const [id, setId] = useState(first);
  const [filter, setFilter] = useState('all');
  const view = useRef(null), idRef = useRef(id), filterRef = useRef(filter);
  idRef.current = id; filterRef.current = filter;
  useEffect(() => { view.current && view.current.select(id); }, [id]);
  useEffect(() => { view.current && view.current.setFilter(filter); }, [filter]);
  const load = useCallback(async el => {
    const { mountTower } = await import('./three/tower.js');
    return mountTower(el, flats, proj);
  }, [flats, proj]);
  const f = byId.get(id);
  const pick = patch => { const n = { tower: f.tower, floor: f.floor, unit: f.unit, ...patch }; setId(`${n.tower}-${n.floor}${n.unit}`); };
  const count = bhk => `${flats.filter(x => x.bhk === bhk && x.status === 'available').length} of ${flats.filter(x => x.bhk === bhk).length}`;
  return (
    <section className="section section--surface" id="availability" aria-labelledby="availability-h">
      <div className="wrap">
        <Head id="availability-h" text={`Flats free ${page.inPlace} today`} lead="Tap a flat in the tower, or choose one below. The chosen flat lights up in the colour of its status." />
        <div className="split split--viz">
          <Rise className="panel">
            <Seg label="Show flats" value={filter} onChange={setFilter} options={[['all', 'All'], ['2', '2 BHK'], ['3', '3 BHK']]} />
            <ul className="legend" aria-label="Colours">
              {Object.values(STATUS).map(s => <li key={s.label}><i className="dot" style={{ background: s.color }} />{s.label}</li>)}
            </ul>
            <div className="picker">
              {proj.towers.length > 1 && (
                <div className="field is-filled"><label htmlFor="pick-tower">Tower</label>
                  <select id="pick-tower" value={f.tower} onChange={e => pick({ tower: e.target.value })}>{proj.towers.map(t => <option key={t} value={t}>Tower {t}</option>)}</select></div>
              )}
              <div className="field is-filled"><label htmlFor="pick-floor">Floor</label>
                <select id="pick-floor" value={f.floor} onChange={e => pick({ floor: e.target.value })}>{Array.from({ length: proj.floors }, (_, i) => proj.floors - i).map(n => <option key={n} value={n}>Floor {n}</option>)}</select></div>
              <div className="field is-filled"><label htmlFor="pick-unit">Flat</label>
                <select id="pick-unit" value={f.unit} onChange={e => pick({ unit: e.target.value })}>{['A', 'B', 'C', 'D'].map(u => <option key={u} value={u}>Flat {u}</option>)}</select></div>
            </div>
            <div className="flat" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: 'spring', bounce: 0, duration: 0.25 }}>
                  <h3>Flat {f.floor}{f.unit}{proj.towers.length > 1 ? `, Tower ${f.tower}` : ''}</h3>
                  <dl>
                    <div><dt>Type</dt><dd>{f.bhk} BHK</dd></div>
                    <div><dt>Area</dt><dd className="num">{f.area.toLocaleString('en-IN')} sq ft</dd></div>
                    <div><dt>Facing</dt><dd>{f.facing}</dd></div>
                    <div><dt>Status</dt><dd><i className="dot" style={{ background: STATUS[f.status].color }} />{STATUS[f.status].label}</dd></div>
                  </dl>
                  {/* the next step for the flat on show: ask about it by name, with the details already in the message */}
                  {f.status !== 'sold' && (() => {
                    const name = `Flat ${f.floor}${f.unit}${proj.towers.length > 1 ? `, Tower ${f.tower}` : ''}`;
                    return (
                      <a className="btn btn--solid flat__ask" target="_blank" rel="noopener"
                        href={wa(`Hello Tamala Homes, I'm interested in ${name} at Tamala ${page.short} (${f.bhk} BHK, ${f.area.toLocaleString('en-IN')} sq ft, ${f.facing} facing). Please share the price and a time to see it.`)}>
                        Ask about {f.floor}{f.unit} on WhatsApp<Arrow /></a>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
            <ul className="rows">
              <li><span>2 BHK available</span><span className="num">{count(2)}</span></li>
              <li><span>3 BHK available</span><span className="num">{count(3)}</span></li>
            </ul>
          </Rise>
          <Viz kind="tower" what="tower" cursor="Drag" poster={`${BASE}/media/posters/tower-${page.key}.webp`} alt={`The ${page.short} towers in 3D, each flat coloured by status`} load={load}
            onView={v => { view.current = v; if (v) { v.onPick = pid => setId(pid); v.select(idRef.current); v.setFilter(filterRef.current); } }} />
        </div>
      </div>
    </section>
  );
}

/* ---------- floor plans ---------- */
function Plans({ page }) {
  const [bhk, setBhk] = useState(3);
  const [mode, setMode] = useState('3d');
  const [room, setRoom] = useState(null);
  const view = useRef(null), st = useRef({ bhk, mode });
  st.current = { bhk, mode };
  useEffect(() => { view.current && view.current.show(bhk); setRoom(null); }, [bhk]);
  useEffect(() => { view.current && view.current.setView(mode); }, [mode]);
  useEffect(() => { view.current && view.current.highlight(room); }, [room]);
  const load = useCallback(async el => {
    const { mountPlan } = await import('./three/floorplan.js');
    return mountPlan(el);
  }, []);
  const plan = PLANS[bhk];
  return (
    <section className="section" id="plans" aria-labelledby="plans-h">
      <div className="wrap">
        <Head id="plans-h" text="Floor plans for 2 and 3 BHK" lead="Turn the plan or switch to the layout. Every flat has a pooja room." />
        <div className="split split--viz">
          <Rise className="panel">
            <div className="seg-row">
              <Seg label="Flat type" value={bhk} onChange={setBhk} options={[[2, '2 BHK'], [3, '3 BHK']]} />
              <Seg label="View" value={mode} onChange={setMode} options={[['3d', '3D'], ['layout', 'Layout']]} />
            </div>
            {/* the three areas a buyer compares: carpet (the rooms inside the walls, as RERA counts it), the balcony, and the
                super built-up figure the flat is sold by. Carpet is worked out from the plan itself, so the numbers always add up */}
            {(() => {
              const sq = r => r.w * r.d, bal = plan.rooms.filter(r => r.id === 'balcony').reduce((s, r) => s + sq(r), 0);
              const carpet = plan.rooms.reduce((s, r) => s + sq(r), 0) - bal;
              return (
                <ul className="rows rows--tight">
                  <li><span>Carpet area</span><span className="num">{Math.round(carpet).toLocaleString('en-IN')} sq ft</span></li>
                  <li><span>Balcony</span><span className="num">{Math.round(bal).toLocaleString('en-IN')} sq ft</span></li>
                  <li><span>Super built-up area</span><span className="num">{plan.area.toLocaleString('en-IN')} sq ft</span></li>
                </ul>
              );
            })()}
            <ul className="rows rows--tight rows--hover" aria-label="Rooms" onMouseLeave={() => setRoom(null)}>
              <AnimatePresence mode="popLayout" initial={false}>
                {plan.rooms.map((r, i) => (
                  <motion.li key={`${bhk}-${r.id}`} tabIndex={0} className={room === r.id ? 'is-on' : undefined}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.02 * i }}
                    onMouseEnter={() => setRoom(r.id)} onFocus={() => setRoom(r.id)} onClick={() => setRoom(r.id)}>
                    <span>{r.name}</span><span className="num">{r.w} × {r.d} ft</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <p className="links"><a className="link" href={`${BASE}/brochures/${page.key}.pdf`} download>Download the {page.short} brochure<Arrow /></a></p>
          </Rise>
          <Viz kind="plan" what="plan" mode={mode} poster={BASE + "/media/posters/plan.webp"} alt="A 3 BHK floor plan shown in 3D with its walls cut away" load={load}
            onView={v => { view.current = v; if (v) { v.show(st.current.bhk); v.setView(st.current.mode); v.onPick = rid => setRoom(rid); } }} />
        </div>
      </div>
    </section>
  );
}

/* ---------- the large photograph: it grows out of its thumbnail and goes back into it; it can be dragged,
   flung away to close, or swiped sideways to the next one. A weak drag springs back. ---------- */
function Lightbox({ id, g, open, setOpen }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const dim = useTransform(y, [-360, 0, 360], [0.3, 1, 0.3]);       // the scrim thins as the photograph is pulled away
  const step = n => { tick(); setOpen(o => (o + n + g.length) % g.length); };
  const end = (_, info) => {
    // decide from where the gesture is going, not from where it was let go
    const px = info.offset.x + project(info.velocity.x), py = info.offset.y + project(info.velocity.y);
    if (Math.abs(py) > 220 && Math.abs(py) > Math.abs(px)) { tick(); setOpen(-1); }
    else if (px < -180) step(1); else if (px > 180) step(-1);
  };
  return (
    <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Photograph" onClick={() => setOpen(-1)}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <motion.div className="lightbox__scrim" style={{ opacity: dim }} />
      <motion.img key={open} layoutId={`g-${id}-${open}`} src={`${BASE}/media/img/${g[open][0]}`} alt={g[open][1]} draggable={false}
        style={{ x, y }} drag dragDirectionLock dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.62}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 30 }} onDragEnd={end} onClick={e => e.stopPropagation()} transition={FLICK} />
      <div className="lightbox__bar" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => step(-1)} aria-label="Previous photograph"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg></button>
        <span className="num">{open + 1} / {g.length}</span>
        <button type="button" onClick={() => step(1)} aria-label="Next photograph"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg></button>
        <button type="button" className="lightbox__close" onClick={() => setOpen(-1)} autoFocus>Close</button>
      </div>
    </motion.div>
  );
}

/* ---------- gallery: a wall of photographs; a press opens one large ---------- */
function Gallery({ page }) {
  const [open, setOpen] = useState(-1);
  const g = page.gallery;
  useEffect(() => {
    if (open < 0) return;
    const key = e => {
      if (e.key === 'Escape') setOpen(-1);
      if (e.key === 'ArrowRight') setOpen(o => (o + 1) % g.length);
      if (e.key === 'ArrowLeft') setOpen(o => (o - 1 + g.length) % g.length);
    };
    document.documentElement.classList.add('is-locked');
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); document.documentElement.classList.remove('is-locked'); };
  }, [open, g.length]);
  return (
    <section className="section section--surface" id="gallery" aria-labelledby="gallery-h">
      <div className="wrap">
        <Head id="gallery-h" text="Inside a finished flat" />
        <div className="wall">
          {g.map(([src, alt], i) => (
            <motion.button key={src} type="button" className="wall__item" data-cursor="Open" onClick={() => setOpen(i)} aria-label={`Open the photograph: ${alt}`}
              initial={{ clipPath: 'inset(100% 0% 0% 0%)' }} whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }} viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.08 * i }}>
              <motion.img layoutId={`g-${page.key}-${i}`} src={`${BASE}/media/img/${src}`} alt={alt} loading="lazy" />
            </motion.button>
          ))}
        </div>
      </div>
      <AnimatePresence>{open >= 0 && <Lightbox id={page.key} g={g} open={open} setOpen={setOpen} />}</AnimatePresence>
    </section>
  );
}

/* ---------- construction progress ---------- */
function Progress({ page }) {
  return (
    <section className="section section--surface" id="progress" aria-labelledby="progress-h">
      <div className="wrap">
        <Head id="progress-h" text="Construction progress" lead="Where the work stands this month. Owners get a site walk with our engineer every quarter." />
        <div className="split">
          <ul className="progress">
            {page.progress.map(([k, v], i) => (
              <Rise as="li" key={k} delay={0.07 * i}>
                <span>{k}</span><span className="progress__pct"><Counter to={v} suffix="%" /></span>
                <span className="progress__bar" aria-hidden="true">
                  <motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: v / 100 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE, delay: 0.1 + 0.07 * i }} />
                </span>
              </Rise>
            ))}
          </ul>
          <Picture className="fill" src={`${BASE}/media/img/${page.progressImg[0]}`} alt={page.progressImg[1]} />
        </div>
      </div>
    </section>
  );
}

/* ---------- the other projects: two large rows; the picture follows the row under the pointer ---------- */
function Others({ page }) {
  const others = ORDER.filter(k => k !== page.key).map(k => PAGES[k]);
  const [h, setH] = useState(-1);
  return (
    <section className="section section--dark others" aria-labelledby="others-h">
      <div className="wrap">
        <Head id="others-h" text="Other projects in Guntur" />
        <ul className="others__list" onMouseLeave={() => setH(-1)}>
          {others.map((o, i) => (
            <Rise as="li" key={o.key} delay={0.1 * i}>
              <Link to={`/projects/${o.key}`} data-cursor="View" onMouseEnter={() => setH(i)} onFocus={() => setH(i)}>
                <span className="others__name">{o.short}</span>
                <span className="others__meta">{o.status}<Arrow /></span>
                <motion.img src={`${BASE}/media/img/${o.cardImg}`} alt="" aria-hidden="true" loading="lazy"
                  initial={false} animate={{ opacity: h === i ? 1 : 0, scale: h === i ? 1 : 0.86, rotate: h === i ? -3 : 0 }} transition={{ duration: 0.45, ease: EASE }} />
              </Link>
            </Rise>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Project({ page }) {
  useEffect(() => { document.title = `${page.name}: ${page.title}`; }, [page]);
  const place = `${page.place}, Guntur, Andhra Pradesh`;
  return (
    <>
      <Nav links={LINKS} />
      <main id="main">
        <Hero word={page.short} title={`${page.name}: ${page.title}`} image={page.hero} alt={page.heroAlt} pos={page.heroPos} />

        <section className="section" id="overview" aria-labelledby="overview-h">
          <div className="wrap">
            <Head id="overview-h" text={page.overviewH} lead={page.overviewP} />
            <div className="split">
              <ul className="rows rows--facts">
                {page.facts.map(([k, v], i) => (
                  <Rise as="li" key={k} delay={0.05 * i}><span>{k}</span><span data-assumed={ASSUMED.has(k) ? '' : undefined}>{v}</span></Rise>
                ))}
              </ul>
              <Picture className="fill" src={`${BASE}/media/img/${page.overviewImg[0]}`} alt={page.overviewImg[1]} />
            </div>
          </div>
        </section>

        <Availability page={page} />
        <Plans page={page} />
        <Gallery page={page} />

        <section className="section" id="location" aria-labelledby="location-h">
          <div className="wrap">
            <Head id="location-h" text={`Getting around from ${page.short}`} lead="Drive times on a weekday morning." />
            <div className="split">
              <div className="panel">
                <ul className="rows">
                  {MAP.landmarks.map((l, i) => <Rise as="li" key={l.name} delay={0.05 * i}><span>{l.name}</span><span className="num">{l.min[page.key]} min by car</span></Rise>)}
                </ul>
                <p className="links">
                  <a className="link" href={gmaps(place)} target="_blank" rel="noopener">Open in Google Maps<Arrow /></a>
                  <a className="link" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`} target="_blank" rel="noopener">Get directions<Arrow /></a>
                </p>
              </div>
              <Rise className="gmap fill">
                <iframe title={`Google map of ${page.place}, Guntur`} src={`https://www.google.com/maps?q=${page.ll}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              </Rise>
            </div>
          </div>
        </section>

        {page.progress && <Progress page={page} />}
        <Visit project={page.short} heading={`Visit ${page.short} this week`} lead="Tell us a day. We call to confirm a time and send a car from our office in Brodipet."
          photo={['build-plans.webp', 'Two men reading building plans spread on the bonnet of a car at a site']} />
        <Others page={page} />
      </main>
      <Footer />
    </>
  );
}
