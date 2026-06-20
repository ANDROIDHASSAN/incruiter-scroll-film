import { useEffect, useRef } from 'react';
import { storyClock } from '../lib/storyClock';

/** Thin top bar scaled by the GOVERNED story progress (not raw scroll). */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return storyClock.subscribe((p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    });
  }, []);

  return (
    <div className="progress" aria-hidden="true">
      <div ref={bar} className="progress__bar" />
    </div>
  );
}
