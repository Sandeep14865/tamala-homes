// Inertial smooth scrolling for a mouse wheel or trackpad (Lenis). Touch scrolling stays the phone's own, and a visitor
// who asks for less motion keeps the browser's plain scroll. Every scroll the site makes itself goes through scrollToY /
// scrollToEl here, so it moves with the same easing and never fights the smoothing.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis = null;

export function startSmooth() {
  if (lenis || typeof window === 'undefined') return;
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1,
    anchors: { offset: -24 },
    // layers with their own scrolling keep it: the phone menu, the photo viewer, 3D views, the map
    prevent: node => !!(node.closest && node.closest('[data-lenis-prevent], .menu, .lightbox, .viz, .gmap')),
  });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // a layer that covers the page (the menu, the photo viewer) locks the page behind it: stop the smoothing too,
  // or a wheel would still move the page underneath
  const html = document.documentElement;
  new MutationObserver(() => (html.classList.contains('is-locked') ? lenis.stop() : lenis.start()))
    .observe(html, { attributes: true, attributeFilter: ['class'] });
}

export function scrollToY(y, { immediate = false } = {}) {
  if (lenis) lenis.scrollTo(y, { immediate, force: true });
  else window.scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
}

export function scrollToEl(el, offset = -24) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, force: true });
  else el.scrollIntoView({ behavior: 'smooth' });
}
