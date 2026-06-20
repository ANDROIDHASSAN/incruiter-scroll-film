import { useEffect, useRef, useState } from 'react';
import type Lenis from 'lenis';
import { initSmoothScroll } from './lib/smoothScroll';
import { gsap, ScrollTrigger } from './lib/gsap';
import { storyClock } from './lib/storyClock';
import { registerScroller } from './lib/scroller';
import { useReducedMotion } from './lib/useReducedMotion';
import { useScrollVelocity } from './webgl/useScrollVelocity';
import ScrollVideo from './components/ScrollVideo';
import LiquidCanvas from './webgl/LiquidCanvas';
import Nav from './components/Nav';
import ScrollProgress from './components/ScrollProgress';
import Cursor from './components/Cursor';
import EntryGate from './components/EntryGate';
import ScrollOverlay from './components/ScrollOverlay';
import Story from './sections/Story';

const SCROLL_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  ' ',
  'Spacebar',
]);

export default function App() {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [entered, setEntered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const velRef = useScrollVelocity(lenis);

  useEffect(() => {
    // Never let the browser restore a prior scroll position — on a scroll-driven page
    // that would jump the story mid-way on reload.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const l = initSmoothScroll(reduced);
    setLenis(l);
    registerScroller(l);

    // Raw scroll only sets the TARGET; the clock paces the real progress so the whole
    // site can't be traversed in under MIN_DURATION (30s). Reduced-motion users are
    // ungoverned so they can move at their own pace.
    storyClock.setGoverned(!reduced);
    const pacer = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => storyClock.setTarget(self.progress),
    });
    const stepClock = (_t: number, deltaMs: number) => storyClock.step(deltaMs / 1000);
    gsap.ticker.add(stepClock);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    const v = videoRef.current;
    const onMeta = () => ScrollTrigger.refresh();
    v?.addEventListener('loadedmetadata', onMeta);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      cancelAnimationFrame(raf);
      v?.removeEventListener('loadedmetadata', onMeta);
      gsap.ticker.remove(stepClock);
      pacer.kill();
      registerScroller(null);
      l.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [reduced]);

  // Lock all scrolling until the visitor chooses to enter — the experience only begins
  // on their terms. Lenis is paused and raw wheel/touch/key input is swallowed.
  useEffect(() => {
    if (!lenis) return;
    storyClock.setEnabled(entered);
    if (entered) {
      lenis.start();
      return;
    }
    lenis.stop();
    window.scrollTo(0, 0);
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKeys);
    return () => {
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', blockKeys);
    };
  }, [lenis, entered]);

  const enableWebGL =
    !reduced && typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) > 4;

  return (
    <>
      <a className="skip-link" href="#story">
        Skip to content
      </a>

      <ScrollVideo videoRef={videoRef} />
      {enableWebGL && <LiquidCanvas videoRef={videoRef} velRef={velRef} />}

      <Nav showCta={entered} />
      <ScrollProgress />
      <Cursor />

      <EntryGate hidden={entered} onEnter={() => setEntered(true)} />
      <ScrollOverlay entered={entered} />

      <main>
        <Story entered={entered} />
      </main>
    </>
  );
}
