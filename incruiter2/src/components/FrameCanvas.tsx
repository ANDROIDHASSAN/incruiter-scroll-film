import { useEffect, useRef } from 'react';
import { storyClock } from '../lib/storyClock';

const FRAME_COUNT = 270;
const framePath = (i: number) => `/frames/frame_${String(i + 1).padStart(4, '0')}.webp`;

/**
 * The cinematic film, rendered as a scroll-scrubbed image sequence on a canvas.
 *
 * This is the bulletproof alternative to scrubbing a <video> (which browsers — phones
 * and Safari especially — throttle or refuse). It only ever draws images, so it behaves
 * identically on every device. Two adjacent frames are cross-blended by the fractional
 * progress, so it looks smooth even though there are a finite number of frames. Frames
 * load progressively; until a target frame is ready the nearest loaded one is shown, and
 * the poster (CSS background) covers the very first paint — so it never flashes black.
 */
export default function FrameCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    // alpha:true so the CSS poster shows through until the first frame is painted
    // (cover-fit frames are fully opaque, so there's no ghosting once drawing starts)
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    const loaded: boolean[] = new Array(FRAME_COUNT).fill(false);
    let anyLoaded = false;
    let cw = 0;
    let ch = 0;
    let lastKey = -1;

    const draw = (force = false) => {
      if (!cw || !anyLoaded) return;
      const p = storyClock.value;
      const exact = p * (FRAME_COUNT - 1);
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(exact)));
      const frac = exact - idx;

      const key = idx + frac;
      if (!force && Math.abs(key - lastKey) < 0.004) return;
      lastKey = key;

      const base = nearestLoaded(idx);
      if (base < 0) return;
      drawCover(images[base], 1);

      const next = idx + 1;
      if (frac > 0.01 && next < FRAME_COUNT && loaded[next]) {
        drawCover(images[next], frac); // cross-blend toward the next frame
      }
      ctx.globalAlpha = 1;
    };

    const drawCover = (img: HTMLImageElement, alpha: number) => {
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number;
      let dh: number;
      let dx: number;
      let dy: number;
      if (cr > ir) {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      } else {
        dh = ch;
        dw = ch * ir;
        dy = 0;
        dx = (cw - dw) / 2;
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const nearestLoaded = (target: number) => {
      if (loaded[target]) return target;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (target - d >= 0 && loaded[target - d]) return target - d;
        if (target + d < FRAME_COUNT && loaded[target + d]) return target + d;
      }
      return -1;
    };

    const resize = () => {
      cw = Math.floor(window.innerWidth * dpr);
      ch = Math.floor(window.innerHeight * dpr);
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      draw(true);
    };

    // Kick off progressive loading (in order, so the opening frames arrive first).
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loaded[i] = true;
        if (!anyLoaded) {
          anyLoaded = true;
          draw(true);
        } else if (Math.abs(i - storyClock.value * (FRAME_COUNT - 1)) < 2) {
          draw(true); // a frame near the current position just arrived — repaint
        }
      };
      img.src = framePath(i);
      images[i] = img;
    }

    window.addEventListener('resize', resize);
    resize();
    const unsub = storyClock.subscribe(() => draw());

    return () => {
      window.removeEventListener('resize', resize);
      unsub();
    };
  }, []);

  return (
    <div ref={wrap} className="film" aria-hidden="true">
      <canvas ref={canvasRef} className="film__canvas" />
    </div>
  );
}
