import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect warns during SSR; this picks the safe one. In a pure-client Vite
// app it is always useLayoutEffect, but keeping the guard makes the hook portable.
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
