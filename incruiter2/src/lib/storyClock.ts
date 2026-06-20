/**
 * The single pacing authority for the whole experience.
 *
 * Raw scroll only sets a *target* (0..1). The actual story progress glides toward that
 * target but its FORWARD speed is capped so the narrative can never be completed in
 * less than `MIN_DURATION` seconds — no matter how fast someone flicks the wheel or
 * drags the scrollbar. Scrolling slower than the cap tracks 1:1 (feels normal); only
 * fast input gets paced. Rewind is allowed to be quicker so going back never drags.
 *
 * Film playhead, active beat, and the progress bar all read from here, so they stay
 * perfectly in sync with the governed pace.
 */
export const MIN_DURATION = 30; // seconds — the hard minimum to reach the end
const REWIND_DURATION = 9; // seconds — full rewind may be faster than forward

let target = 0;
let value = 0;
let governed = true;
let enabled = true;
const subs = new Set<(p: number) => void>();

export const storyClock = {
  get value() {
    return value;
  },
  setTarget(t: number) {
    // While disabled (entry gate locked) the story never advances.
    target = !enabled ? 0 : t < 0 ? 0 : t > 1 ? 1 : t;
  },
  setGoverned(g: boolean) {
    governed = g;
  },
  setEnabled(e: boolean) {
    enabled = e;
    if (!e) target = 0;
  },
  /** Advance the governed value. Call once per frame with delta time in seconds. */
  step(dtSeconds: number) {
    if (!governed) {
      value = target;
    } else {
      const maxFwd = dtSeconds / MIN_DURATION;
      const maxRev = dtSeconds / REWIND_DURATION;
      let d = target - value;
      if (d > maxFwd) d = maxFwd;
      else if (d < -maxRev) d = -maxRev;
      value += d;
    }
    if (value < 0) value = 0;
    else if (value > 1) value = 1;
    for (const f of subs) f(value);
  },
  subscribe(f: (p: number) => void) {
    subs.add(f);
    f(value);
    return () => {
      subs.delete(f);
    };
  },
};
