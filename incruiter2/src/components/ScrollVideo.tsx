import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { storyClock } from '../lib/storyClock';

type Props = {
  /** Shared ref so the WebGL liquid layer can reuse this single decoded video. */
  videoRef: React.RefObject<HTMLVideoElement>;
};

/**
 * Full-bleed cinematic film whose playhead is driven by the governed story clock —
 * scrubbing the clip across the page at a paced, minimum-30s rate. Smoothness comes
 * from: a 60fps motion-interpolated, all-keyframe (all-intra) encode (every frame seeks
 * instantly and there are enough frames to look high-fps even when stretched over a
 * long scroll), writing currentTime on GSAP's single shared ticker, and a seek-backlog
 * guard so a new seek is never queued before the last resolves.
 */
export default function ScrollVideo({ videoRef }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = videoRef.current!;
    v.muted = true;
    v.playsInline = true;
    v.pause(); // scroll owns the playhead — it never plays on its own

    let duration = 0;
    let seeking = false;
    let lastWritten = -1;

    const onMeta = () => {
      duration = v.duration || 0;
    };
    v.addEventListener('loadedmetadata', onMeta);
    if (v.readyState >= 1) onMeta();

    const onSeeking = () => (seeking = true);
    const onSeeked = () => (seeking = false);
    v.addEventListener('seeking', onSeeking);
    v.addEventListener('seeked', onSeeked);

    // Skip the clip's black fade-in/out so every beat — including the intro at
    // progress 0 — sits on a lit, cinematic frame.
    const START_TRIM = 1.3;
    const END_TRIM = 0.25;

    const tick = () => {
      if (!duration || v.readyState < 2) return;
      const span = Math.max(0.1, duration - START_TRIM - END_TRIM);
      const ct = START_TRIM + storyClock.value * span;
      // Only seek when idle and the frame actually moved (~1/90s granularity for 60fps).
      if (!seeking && Math.abs(ct - lastWritten) > 1 / 90) {
        lastWritten = ct;
        try {
          v.currentTime = ct;
        } catch {
          /* seek can throw mid-load; ignore */
        }
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('seeking', onSeeking);
      v.removeEventListener('seeked', onSeeked);
    };
  }, [videoRef]);

  return (
    <div ref={wrap} className="film" aria-hidden="true">
      <video
        ref={videoRef}
        className="film__video"
        poster="/videos/incruiterblue2-poster.jpg"
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
      >
        <source src="/videos/incruiterblue2-seq60.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
