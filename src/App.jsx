// The app: intro, cursor, and the routed pages with a curtain between them.
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { usePath, Ready, EASE, takeScroll } from './lib.jsx';
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

const curtain = {
  in: { scaleY: 1, originY: 0 },
  on: { scaleY: 0, originY: 0, transition: { type: 'spring', bounce: 0, duration: 0.6 } },
  out: { scaleY: 1, originY: 1, transition: { type: 'spring', bounce: 0, duration: 0.4 } },
};

function Page({ children }) {
  // a link such as /#projects lands on its section once the new page stands
  useEffect(() => {
    if (!location.hash) return;
    const t = setTimeout(() => { const el = document.querySelector(location.hash); el && el.scrollIntoView(); }, 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div className="page" initial="in" animate="on" exit="out">
      {children}
      <motion.div className="curtain" variants={curtain} aria-hidden="true" />
    </motion.div>
  );
}

// after a page change: the top for a new page, or the remembered spot after Back or Forward. The new page may still be
// growing (lazy sections), so try for a few frames until the spot can be reached
function landAt() {
  const y = takeScroll();
  const go = (n = 0) => { window.scrollTo({ top: y, behavior: 'instant' }); if (Math.abs(scrollY - y) > 2 && n < 30) requestAnimationFrame(() => go(n + 1)); };
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
        <AnimatePresence>{!ready && <Preloader key="intro" onDone={done} />}</AnimatePresence>
        <AnimatePresence mode="wait" onExitComplete={landAt}>
          <Page key={path}>{route(path)}</Page>
        </AnimatePresence>
      </Ready.Provider>
    </MotionConfig>
  );
}
