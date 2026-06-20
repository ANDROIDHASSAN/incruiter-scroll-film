import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

/**
 * The single source of truth for scroll position.
 * Lenis owns the scroll position; GSAP's ScrollTrigger reads from it via ONE shared
 * ticker. Never add a second requestAnimationFrame scroll loop anywhere in the app.
 */
export function initSmoothScroll(prefersReducedMotion: boolean) {
  const lenis = new Lenis({
    duration: prefersReducedMotion ? 0 : 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
    smoothWheel: !prefersReducedMotion,
    syncTouch: false, // native momentum on touch = better mobile feel
    touchMultiplier: 1.2,
    wheelMultiplier: 1,
  });

  // 1) Lenis tells ScrollTrigger to recalc on every scroll.
  lenis.on('scroll', ScrollTrigger.update);

  // 2) ONE ticker: GSAP drives Lenis. Lenis' own RAF is never started.
  const onTick = (time: number) => {
    lenis.raf(time * 1000); // gsap time is seconds, lenis wants ms
  };
  gsap.ticker.add(onTick);

  // 3) Remove gsap's frame smoothing lag for tight scroll coupling.
  gsap.ticker.lagSmoothing(0);

  // Patch destroy so we also detach our ticker callback.
  const originalDestroy = lenis.destroy.bind(lenis);
  lenis.destroy = () => {
    gsap.ticker.remove(onTick);
    originalDestroy();
  };

  return lenis;
}
