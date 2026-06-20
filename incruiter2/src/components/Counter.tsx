import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useReducedMotion } from '../lib/useReducedMotion';

type Props = {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  /** When this turns true the count animation runs once. */
  active?: boolean;
};

/** Counts from 0 → `to`, locale-formatted. Fires the first time `active` is true. */
export default function Counter({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
  active = false,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);
  const reduced = useReducedMotion();

  const fmt = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  useEffect(() => {
    const el = ref.current!;
    if (!active || hasRun.current) return;
    hasRun.current = true;

    if (reduced) {
      el.textContent = prefix + fmt.format(to) + suffix;
      return;
    }

    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: to,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = prefix + fmt.format(obj.v) + suffix;
      },
    });
    return () => {
      tween.kill();
    };
  }, [active, reduced, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {fmt.format(0)}
      {suffix}
    </span>
  );
}
