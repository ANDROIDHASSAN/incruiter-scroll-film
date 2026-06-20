import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useHasFinePointer } from '../lib/useMediaQuery';

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

/**
 * CTA that magnetically follows the cursor within its bounds and snaps back.
 * Renders an <a> when `href` is given, otherwise a <button>. State-driven (Framer
 * Motion) — never coupled to scroll. Magnetic pull disabled on touch.
 */
export default function MagneticButton({ children, href, onClick, className = '' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const fine = useHasFinePointer();
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  const onMove = (e: React.MouseEvent) => {
    if (!fine || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const shared = {
    className: `magnetic ${className}`,
    style: { x, y },
    onMouseMove: onMove,
    onMouseLeave: reset,
    whileTap: { scale: 0.96 },
  } as const;

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...shared}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      {...shared}
    >
      {children}
    </motion.button>
  );
}
