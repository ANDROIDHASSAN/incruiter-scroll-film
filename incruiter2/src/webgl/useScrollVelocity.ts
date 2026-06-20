import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';

/**
 * Turns Lenis scroll velocity into a smoothed, normalized 0..1 ref.
 * Read `.current` inside a render loop and damp it toward 0 there for the settle.
 */
export function useScrollVelocity(lenis: Lenis | null) {
  const vel = useRef(0);
  useEffect(() => {
    if (!lenis) return;
    const onScroll = (e: { velocity: number }) => {
      vel.current = Math.min(Math.abs(e.velocity) / 40, 1);
    };
    lenis.on('scroll', onScroll);
    return () => {
      lenis.off('scroll', onScroll);
    };
  }, [lenis]);
  return vel;
}
