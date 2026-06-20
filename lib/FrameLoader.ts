import { FRAME_COUNT, FRAME_PATH } from "./story";

/**
 * Progressive frame pipeline.
 *
 * - Decodes WebP frames into ImageBitmaps (GPU-friendly, fast to drawImage).
 * - Prioritises a window around the current playhead (predictive buffering)
 *   then back-fills the rest so the whole film ends up resident in cache.
 * - Falls back to HTMLImageElement if createImageBitmap is unavailable.
 */
export type Frame = ImageBitmap | HTMLImageElement;

export class FrameLoader {
  readonly count: number;
  private cache = new Map<number, Frame>();
  private inflight = new Set<number>();
  private useBitmap: boolean;
  private destroyed = false;

  onProgress?: (loaded: number, total: number) => void;

  constructor(count = FRAME_COUNT) {
    this.count = count;
    this.useBitmap = typeof createImageBitmap === "function";
  }

  has(i: number) {
    return this.cache.has(i);
  }

  get(i: number): Frame | undefined {
    return this.cache.get(i);
  }

  /** Nearest already-loaded frame to `i` — guarantees the canvas always has something to draw. */
  nearest(i: number): Frame | undefined {
    if (this.cache.has(i)) return this.cache.get(i);
    for (let r = 1; r < this.count; r++) {
      if (this.cache.has(i - r)) return this.cache.get(i - r);
      if (this.cache.has(i + r)) return this.cache.get(i + r);
    }
    return undefined;
  }

  private clamp(i: number) {
    return Math.max(1, Math.min(this.count, i));
  }

  private async load(i: number): Promise<void> {
    i = this.clamp(i);
    if (this.cache.has(i) || this.inflight.has(i) || this.destroyed) return;
    this.inflight.add(i);
    try {
      if (this.useBitmap) {
        const res = await fetch(FRAME_PATH(i));
        const blob = await res.blob();
        const bmp = await createImageBitmap(blob);
        if (this.destroyed) {
          bmp.close();
          return;
        }
        this.cache.set(i, bmp);
      } else {
        const img = new Image();
        img.src = FRAME_PATH(i);
        img.decoding = "async";
        await img.decode().catch(() => {});
        this.cache.set(i, img);
      }
      this.onProgress?.(this.cache.size, this.count);
    } catch {
      // network hiccup — leave it absent; nearest() covers the gap.
    } finally {
      this.inflight.delete(i);
    }
  }

  /**
   * Eagerly load a small lead-in so the hero never shows a blank canvas,
   * then stream everything else in the background.
   * Resolves once `lead` frames are ready.
   */
  async warmup(lead = 24): Promise<void> {
    const first: Promise<void>[] = [];
    for (let i = 1; i <= Math.min(lead, this.count); i++) first.push(this.load(i));
    await Promise.all(first);
    // Background fill — chunked so we never saturate the connection.
    this.fillAll();
  }

  private async fillAll() {
    const concurrency = 6;
    let next = 1;
    const worker = async () => {
      while (next <= this.count && !this.destroyed) {
        const i = next++;
        await this.load(i);
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
    for (let i = center; i <= center + ahead; i++) this.load(i);
    for (let i = center; i >= center - behind; i--) this.load(i);
  }

  destroy() {
    this.destroyed = true;
    for (const f of this.cache.values()) {
      if (typeof ImageBitmap !== "undefined" && f instanceof ImageBitmap) f.close();
    }
    this.cache.clear();
  }
}
