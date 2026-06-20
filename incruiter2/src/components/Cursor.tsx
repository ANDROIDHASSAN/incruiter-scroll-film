import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useHasFinePointer } from '../lib/useMediaQuery';

/**
 * A lagging dot + ring custom cursor. Pure spring-driven transforms (no extra RAF).
 * Rendered only on devices with a fine pointer; never intercepts clicks.
 */
export default function Cursor() {
  const fine = useHasFinePointer();
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 260, damping: 28 });
  const ringY = useSpring(dotY, { stiffness: 260, damping: 28 });
  const scale = useSpring(1, { stiffness: 260, damping: 20 });
  const hovering = useRef(false);

  useEffect(() => {
    if (!fine) return;
    const move = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      const interactive = !!(e.target as HTMLElement)?.closest('a,button,[data-cursor]');
      if (interactive !== hovering.current) {
        hovering.current = interactive;
        scale.set(interactive ? 1.8 : 1);
      }
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [fine, dotX, dotY, scale]);

  if (!fine) return null;

  return (
    <>
      <motion.div className="cursor cursor--dot" style={{ x: dotX, y: dotY }} aria-hidden="true" />
      <motion.div
        className="cursor cursor--ring"
        style={{ x: ringX, y: ringY, scale }}
        aria-hidden="true"
      />
    </>
  );
}
