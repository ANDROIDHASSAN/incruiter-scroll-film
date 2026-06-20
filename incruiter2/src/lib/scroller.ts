import type Lenis from 'lenis';

let _lenis: Lenis | null = null;

export function registerScroller(l: Lenis | null) {
  _lenis = l;
}

/** Smooth-scroll to a fraction (0..1) of the page — used by the Explore CTA to
 *  kick off the journey. The 30s governor still paces the visual reveal. */
export function scrollToProgress(p: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y = Math.max(0, Math.min(max, max * p));
  if (_lenis) _lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}
