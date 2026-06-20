import { useEffect, useState } from 'react';

/** Tracks `prefers-reduced-motion: reduce` and updates live if the user changes it. */
export function useReducedMotion() {
  const [reduced, set] = useState(false);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => set(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}
