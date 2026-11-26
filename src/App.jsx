// The app: intro, cursor, and the routed pages with a curtain between them.
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { usePath, Ready, EASE, takeScroll } from './lib.jsx';
import { scrollToY } from './smooth.js';
import { LEAF, APERTURE } from './fx.jsx';
import { Cursor, Preloader } from './components.jsx';
import { PAGES } from './content.js';
import Home from './Home.jsx';
import Project from './Project.jsx';
import Legal from './Legal.jsx';

function route(path) {
  if (path === '/') return <Home />;
  const m = path.match(/^\/projects\/([a-z-]+?)(?:\.html)?$/);
  if (m && PAGES[m[1]]) return <Project page={PAGES[m[1]]} />;
  if (['/privacy', '/terms', '/credits'].includes(path.replace('.html', ''))) return <Legal kind={path.replace('.html', '').slice(1)} />;
  return <Legal kind="missing" />;
}

// Between pages the Tamala leaf is the curtain: the old page closes behind a green leaf that grows from the middle of the
// screen, and the new page opens through a leaf-shaped window that grows the same way. Less motion: a plain fade.
const SWEEP = [0.76, 0, 0.24, 1];
// each step names its start as well as its end, in the same unit: the browser reports a mask's size in pixels, and an
// animation from pixels to vmin can't be blended, so it would jump
const size = v => ({ WebkitMaskSize: v, maskSize: v });
const SHUT = '0vmin 0vmin, 100% 100%', OPEN = '640vmin 640vmin, 100% 100%';
const reveal = {
  in: size(SHUT),
  on: { ...size([SHUT, OPEN]), transition: { duration: 0.95, ease: SWEEP } },
  out: {},
};
const cover = {
  in: size('0vmin 0vmin'),
  on: size('0vmin 0vmin'),
  out: { ...size(['0vmin 0vmin', '640vmin 640vmin']), transition: { duration: 0.62, ease: SWEEP } },
};
const fadeReveal = { in: { opacity: 1 }, on: { opacity: 0, transition: { duration: 0.4 } }, out: {} };
const fadeCover = { in: { opacity: 0 }, on: { opacity: 0 }, out: { opacity: 1, transition: { duration: 0.3 } } };

function Page({ children }) {
  const still = useReducedMotion();
  // a link such as /#projects lands on its section once the new page stands
  useEffect(() => {
    if (!location.hash) return;
    const t = setTimeout(() => { const el = document.querySelector(location.hash); el && el.scrollIntoView(); }, 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div className="page" initial="in" animate="on" exit="out">
      {children}
      <motion.div className="curtain curtain--reveal" variants={still ? fadeReveal : reveal} aria-hidden="true"
        style={still ? undefined : { WebkitMaskImage: APERTURE, maskImage: APERTURE }} />
      <motion.div className="curtain curtain--cover" variants={still ? fadeCover : cover} aria-hidden="true"
        style={still ? undefined : { WebkitMaskImage: LEAF, maskImage: LEAF }} />
    </motion.div>
  );
}

// after a page change: the top for a new page, or the remembered spot after Back or Forward. The new page may still be
// growing (lazy sections), so try for a few frames until the spot can be reached
function landAt() {
  const y = takeScroll();
  const go = (n = 0) => { scrollToY(y, { immediate: true }); if (Math.abs(scrollY - y) > 2 && n < 30) requestAnimationFrame(() => go(n + 1)); };
  go();
}

export default function App() {
  const path = usePath();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(!!reduce);
  const done = useCallback(() => setReady(true), []);
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>
      <Ready.Provider value={ready}>
        <Cursor />
        <div className="grain" aria-hidden="true" />
        <AnimatePresence>{!ready && <Preloader key="intro" onDone={done} />}</AnimatePresence>
        <AnimatePresence mode="wait" onExitComplete={landAt}>
          <Page key={path}>{route(path)}</Page>
        </AnimatePresence>
      </Ready.Provider>
    </MotionConfig>
  );
}
