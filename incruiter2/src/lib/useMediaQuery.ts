import { useEffect, useState } from 'react';

/** Reactive `matchMedia` hook. Returns whether the given query currently matches. */
export function useMediaQuery(query: string) {
  const [matches, set] = useState(() =>
    typeof window !== 'undefined' ? matchMedia(query).matches : false,
  );
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => set(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** True only on devices that have a real pointer (mouse/trackpad). */
export function useHasFinePointer() {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
