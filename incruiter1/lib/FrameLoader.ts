import { FRAME_COUNT, FRAME_PATH } from "./story";

/**
 * Progressive frame pipeline (browser-managed memory model).
 *
 * Frames are loaded as <img> elements rather than retained ImageBitmaps. The
 * browser keeps the *encoded* bytes (a few tens of MB for the whole film) and
 * only ever holds the **decoded** RGBA surface for frames that are actually
 * painted — evicting the rest under memory pressure. That keeps a high-res
 * (1440p) film safe on phones, where decoding+retaining all 361 frames would
 * otherwise need gigabytes of RAM.
 *
 * - Warmup eagerly loads a lead-in so the hero never shows a blank canvas.
 * - The rest streams in the background with bounded concurrency.
 * - `ensureWindow` prioritises frames around the playhead (predictive buffering).
 * - Drawing is done by the renderer; `nearest()` guarantees there is always a
 *   usable frame so there is never a white/black flash.
 */
export type Frame = HTMLImageElement;

export class FrameLoader {
  readonly count: number;
  private imgs: (HTMLImageElement | undefined)[];
  private loaded = 0;
  private destroyed = false;

  onProgress?: (loaded: number, total: number) => void;

  constructor(count = FRAME_COUNT) {
    this.count = count;
    this.imgs = new Array(count).fill(undefined);
  }

  private clamp(i: number) {
    return Math.max(1, Math.min(this.count, i));
  }

  has(i: number): boolean {
    const im = this.imgs[i - 1];
    return !!im && im.complete && im.naturalWidth > 0;
  }

  get(i: number): Frame | undefined {
    const im = this.imgs[i - 1];
    return im && im.complete && im.naturalWidth > 0 ? im : undefined;
  }

  /** Nearest already-decoded frame — guarantees the canvas always has something to draw. */
  nearest(i: number): Frame | undefined {
    i = this.clamp(i);
    if (this.has(i)) return this.get(i);
    for (let r = 1; r < this.count; r++) {
      if (this.has(i - r)) return this.get(i - r);
      if (this.has(i + r)) return this.get(i + r);
    }
    return undefined;
  }

  /** Begin loading frame `i` (idempotent). Returns the <img>. */
  private request(i: number): HTMLImageElement | undefined {
    i = this.clamp(i);
    const existing = this.imgs[i - 1];
    if (existing || this.destroyed) return existing;
    const im = new Image();
    im.decoding = "async";
    const done = () => {
      if (im.dataset.counted) return;
      im.dataset.counted = "1";
      this.loaded++;
      this.onProgress?.(this.loaded, this.count);
    };
    im.addEventListener("load", done, { once: true });
    im.addEventListener("error", done, { once: true });
    im.src = FRAME_PATH(i);
    this.imgs[i - 1] = im;
    return im;
  }

  private waitLoad(im: HTMLImageElement): Promise<void> {
    if (im.complete) return Promise.resolve();
    return new Promise((res) => {
      const h = () => res();
      im.addEventListener("load", h, { once: true });
      im.addEventListener("error", h, { once: true });
    });
  }

  /**
   * Eagerly load (and decode) a small lead-in so the hero is sharp immediately,
   * then stream the remainder in the background. Resolves once `lead` is ready.
   */
  async warmup(lead = 24): Promise<void> {
    const first: Promise<unknown>[] = [];
    for (let i = 1; i <= Math.min(lead, this.count); i++) {
      const im = this.request(i);
      if (im) first.push(im.decode().catch(() => {}));
    }
    await Promise.all(first);
    this.fillAll();
  }

  /**
   * Background fill — bounded concurrency so we never saturate the connection.
   * Awaits the *load* (not a forced decode) so memory stays at the encoded
   * footprint; the browser decodes lazily only when a frame is painted.
   */
  private async fillAll() {
    const concurrency = 8;
    let next = 1;
    const worker = async () => {
      while (next <= this.count && !this.destroyed) {
        const i = next++;
        const im = this.request(i);
        if (im) await this.waitLoad(im);
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  /**
   * Predictive buffering around the playhead. Loads frames ahead (in scroll
   * direction) more aggressively than behind.
   */
  ensureWindow(center: number, ahead = 40, behind = 12) {
    center = this.clamp(center);
    for (let i = center; i <= center + ahead; i++) this.request(i);
    for (let i = center; i >= center - behind; i--) this.request(i);
  }

  destroy() {
    this.destroyed = true;
    for (const im of this.imgs) {
      if (im) {
        im.onload = null;
        im.onerror = null;
        im.src = "";
      }
    }
    this.imgs = [];
  }
}
