import { useEffect, useRef } from 'react';
import { storyClock } from '../lib/storyClock';
import { intro } from '../data/content';

/** Scroll fraction over which the black curtain lifts completely. */
const FADE_END = 0.05;

/**
 * After the visitor enters, a black curtain holds with a single instruction —
 * "Scroll to explore". As they begin scrolling its opacity drops in lock-step with
 * progress, lifting to reveal the film and the story beneath. The clearest possible
 * "do this next" for any visitor.
 */
export default function ScrollOverlay({ entered }: { entered: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return storyClock.subscribe((p) => {
      const el = ref.current;
      if (!el) return;
      const o = entered ? Math.max(0, Math.min(1, 1 - p / FADE_END)) : 0;
      el.style.opacity = String(o);
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
  }, [entered]);

  return (
    <div ref={ref} className="scroll-overlay" aria-hidden="true">
      <div className="scroll-overlay__inner">
        <span className="scroll-overlay__text">{intro.hint}</span>
        <span className="scroll-overlay__cue" />
      </div>
    </div>
  );
}
