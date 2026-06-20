"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { FrameLoader, type Frame } from "@/lib/FrameLoader";
import {
  BEATS,
  NOISE_WORDS,
  PRODUCTS,
  CHAPTER_MARKERS,
  FRAME_COUNT,
} from "@/lib/story";

// ── math helpers ─────────────────────────────────────────────────────────
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Trapezoid visibility curve over a beat's local 0..1 progress. */
function band(local: number, enter: number, exit: number) {
  if (local <= 0 || local >= 1) return 0;
  if (local < enter) return smooth(local / enter);
  if (local > exit) return smooth((1 - local) / (1 - exit));
  return 1;
}

const SCROLL_HEIGHT_DESKTOP = 24000;
const SCROLL_HEIGHT_MOBILE = 16000;

export default function ScrollFilm() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const overlayBeats = useRef<(HTMLDivElement | null)[]>([]);
  const noiseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prodRefs = useRef<
    { block: HTMLDivElement | null; name: HTMLElement | null; lines: (HTMLDivElement | null)[] }[]
  >(PRODUCTS.map(() => ({ block: null, name: null, lines: [] })));
  const endingRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const railItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const loader = new FrameLoader(FRAME_COUNT);

    const mq = (q: string) => window.matchMedia(q).matches;
    const prefersReduced = mq("(prefers-reduced-motion: reduce)");
    // Coarse pointer / small screen / low core-count → treat as constrained device.
    const cores = navigator.hardwareConcurrency || 4;
    const deviceMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
    let isMobile = mq("(max-width: 820px)") || mq("(pointer: coarse)");
    const lowPower = cores <= 4 || deviceMem <= 4;
    const blendEnabled = !prefersReduced && !lowPower;

    const applyTrackHeight = () => {
      isMobile = mq("(max-width: 820px)") || mq("(pointer: coarse)");
      if (trackRef.current) {
        trackRef.current.style.height = `${isMobile ? SCROLL_HEIGHT_MOBILE : SCROLL_HEIGHT_DESKTOP}px`;
      }
    };
    applyTrackHeight();

    // ── canvas sizing ──
    // Cap pixel ratio harder on constrained devices to keep the fill-rate sane.
    const dprCap = () => (isMobile ? (lowPower ? 1.5 : 2) : 2);
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap());
    let cw = 0;
    let ch = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, dprCap());
      cw = Math.round(window.innerWidth * dpr);
      ch = Math.round(window.innerHeight * dpr);
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      // resetting the backing store clears context state — restore high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    resize();

    const drawFrame = (frame: Frame, alpha: number) => {
      const iw = frame.naturalWidth;
      const ih = frame.naturalHeight;
      if (!iw || !ih) return;
      const scale = Math.max(cw / iw, ch / ih);
      const w = iw * scale;
      const h = ih * scale;
      const x = (cw - w) / 2;
      const y = (ch - h) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(frame, x, y, w, h);
    };

    // ── velocity smoothing ──
    let velSmooth = 0;

    // ── per-frame render ──
    let lastActiveRail = -1;
    let firstDrawn = false; // fade the canvas in over the poster on first real frame

    const render = (p: number, rawVel: number) => {
      p = clamp01(p);
      let presence = 0; // how strongly narrative text is on screen → scrim strength

      // smooth + normalise scroll velocity for reactive typography
      velSmooth += (rawVel - velSmooth) * 0.12;
      const vf = prefersReduced ? 0 : clamp(velSmooth / 28, -1.4, 1.4);

      // ----- canvas film -----
      const target = 1 + p * (FRAME_COUNT - 1);
      const idx = Math.floor(target);
      const frac = target - idx;
      const a = loader.get(idx) || loader.nearest(idx);
      const b = loader.get(idx + 1) || a;
      if (a) {
        ctx.globalAlpha = 1;
        drawFrame(a, 1);
        if (blendEnabled && b && b !== a && frac > 0.001) drawFrame(b, frac); // frame blending
        ctx.globalAlpha = 1;
        if (!firstDrawn) {
          // hand off seamlessly from the CSS poster (same frame) to the live canvas
          firstDrawn = true;
          canvas.style.opacity = "1";
        }
      }
      const ahead = isMobile ? 24 : 50;
      const behind = isMobile ? 10 : 18;
      loader.ensureWindow(idx, rawVel >= 0 ? ahead : behind, rawVel >= 0 ? behind : ahead);

      // ----- beats -----
      for (let i = 0; i < BEATS.length; i++) {
        const el = overlayBeats.current[i];
        if (!el) continue;
        const beat = BEATS[i];
        const local = (p - beat.from) / (beat.to - beat.from);
        const vis = band(local, 0.34, 0.72);
        if (vis <= 0.001) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const enterT = smooth(clamp01(local / 0.34));
        const exitT = smooth(clamp01((local - 0.72) / 0.28));
        let ty = 0;
        let sc = 1;
        let blur = 0;
        switch (beat.reveal) {
          case "blur":
            ty = (1 - enterT) * 26 - exitT * 26 + vf * 22;
            blur = (1 - enterT) * 16 + exitT * 12;
            sc = lerp(1.04, 1.0, enterT);
            break;
          case "scale":
            sc = 0.9 + enterT * 0.1 - exitT * 0.05;
            ty = -exitT * 18 + vf * 14;
            break;
          case "rise":
          default:
            ty = (1 - enterT) * 56 - exitT * 56 + vf * 30;
            blur = (1 - enterT) * 6;
            break;
        }
        el.style.opacity = String(vis);
        el.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(3)})`;
        el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "none";
        if (vis > presence) presence = vis;
      }

      // ----- noise field (chapter 2) -----
      for (let i = 0; i < NOISE_WORDS.length; i++) {
        const el = noiseRefs.current[i];
        if (!el) continue;
        const w = NOISE_WORDS[i];
        const local = (p - w.from) / (w.to - w.from);
        const vis = band(local, 0.22, 0.82);
        if (vis <= 0.001) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const enterT = smooth(clamp01(local / 0.22));
        const exitT = smooth(clamp01((local - 0.82) / 0.18));
        const phase = (i * 1.37) % 1;
        const drift = (1 - enterT) * -22 + exitT * 30 + vf * 10 * (phase - 0.5);
        const blur = (1 - enterT) * 10 + exitT * 14;
        el.style.opacity = String(vis * w.opacity);
        el.style.transform = `translate(-50%, calc(-50% + ${drift.toFixed(1)}px))`;
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
        if (vis * 0.5 > presence) presence = vis * 0.5;
      }

      // ----- products -----
      for (let i = 0; i < PRODUCTS.length; i++) {
        const refs = prodRefs.current[i];
        const prod = PRODUCTS[i];
        if (!refs?.block) continue;
        const local = (p - prod.from) / (prod.to - prod.from);
        const vis = band(local, 0.14, 0.82);
        if (vis <= 0.001) {
          if (refs.block.style.opacity !== "0") refs.block.style.opacity = "0";
          continue;
        }
        const enterT = smooth(clamp01(local / 0.14));
        const exitT = smooth(clamp01((local - 0.82) / 0.18));
        const ty = (1 - enterT) * 46 - exitT * 60;
        const sc = lerp(0.975, 1.03, smooth(clamp01(local))); // slow cinematic push-in
        refs.block.style.opacity = String(vis);
        refs.block.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(3)})`;
        if (vis * 0.62 > presence) presence = vis * 0.62;
        if (refs.name) {
          refs.name.style.transform = `translate3d(${(vf * -42).toFixed(1)}px, 0, 0)`;
        }
        for (let j = 0; j < prod.lines.length; j++) {
          const lineEl = refs.lines[j];
          if (!lineEl) continue;
          const tStart = 0.18 + j * 0.13;
          const lvis = smooth(clamp01((local - tStart) / 0.14));
          const lty = (1 - lvis) * 24;
          lineEl.style.opacity = String(lvis * vis);
          lineEl.style.transform = `translate3d(${(vf * -14).toFixed(1)}px, ${lty.toFixed(1)}px, 0)`;
        }
      }

      // ----- ending -----
      if (endingRef.current) {
        const ev = smooth(clamp01((p - 0.955) / 0.03));
        endingRef.current.style.opacity = String(ev);
        endingRef.current.style.transform = `translate3d(0, ${((1 - ev) * 30).toFixed(1)}px, 0)`;
        endingRef.current.classList.toggle("live", p > 0.985);
        if (ev * 0.95 > presence) presence = ev * 0.95;
      }

      // narrative scrim — dims the busy film (and its baked captions) under text
      if (scrimRef.current) {
        scrimRef.current.style.opacity = (presence * 0.92).toFixed(3);
      }

      // ----- chrome -----
      if (brandRef.current) {
        const bv = smooth(clamp01((p - 0.03) / 0.05));
        brandRef.current.style.opacity = String(bv);
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(1 - smooth(clamp01(p / 0.02)));
      }
      if (railRef.current) {
        const rv = smooth(clamp01((p - 0.05) / 0.05)) * (1 - smooth(clamp01((p - 0.93) / 0.03)));
        railRef.current.style.opacity = String(rv);
      }
      if (barRef.current) {
        barRef.current.style.width = (p * 100).toFixed(3) + "%";
      }
      // active chapter on the rail
      let active = 0;
      for (let i = 0; i < CHAPTER_MARKERS.length; i++) {
        if (p >= CHAPTER_MARKERS[i].at) active = i;
      }
      if (active !== lastActiveRail) {
        railItemRefs.current.forEach((it, i) => it?.classList.toggle("active", i === active));
        lastActiveRail = active;
      }
    };

    // ── Lenis smooth scroll ──
    const lenis = new Lenis({
      lerp: prefersReduced ? 1 : isMobile ? 0.1 : 0.085,
      wheelMultiplier: 1,
      smoothWheel: !prefersReduced,
      // Native momentum on touch (robust everywhere); the rAF still follows scroll
      // position to scrub the film, so it stays smooth without fighting the OS.
      syncTouch: false,
      touchMultiplier: 1.1,
    });
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    let rafId = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      const p = (lenis as unknown as { progress: number }).progress || 0;
      const v = (lenis as unknown as { velocity: number }).velocity || 0;
      render(Number.isFinite(p) ? p : 0, Number.isFinite(v) ? v : 0);
      rafId = requestAnimationFrame(loop);
    };

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        applyTrackHeight();
        resize();
        lenis.resize();
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // ── start immediately — no blocking loader ──
    // The rAF loop runs right away and paints the nearest available frame; the
    // CSS poster (frame 1) covers the canvas until the first real draw, so there
    // is never a black screen or a loading gate. Frames stream in the background.
    loader.warmup(prefersReduced ? 6 : 14);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      lenis.destroy();
      loader.destroy();
    };
  }, []);

  return (
    <>
      {/* fixed cinematic stage — the poster (frame 1) shows instantly, the canvas
          fades in over it on first paint, so there is no loading screen. */}
      <div className="stage" aria-hidden>
        <div className="poster" />
        <canvas ref={canvasRef} className="film-canvas" />
        <div className="text-scrim" ref={scrimRef} />
        <div className="chroma" />
        <div className="vignette" />
        <div className="grain" />
      </div>

      {/* typography beats */}
      <div className="overlay" aria-hidden>
        {BEATS.map((beat, i) => (
          <div
            key={beat.id}
            ref={(el) => {
              overlayBeats.current[i] = el;
            }}
            className={`beat size-${beat.size}`}
          >
            <div className={`beat-inner${beat.accent ? " accent" : ""}`}>{beat.text}</div>
          </div>
        ))}
      </div>

      {/* noise field */}
      <div className="noise-field" aria-hidden>
        {NOISE_WORDS.map((w, i) => (
          <div
            key={w.text + i}
            ref={(el) => {
              noiseRefs.current[i] = el;
            }}
            className="noise-word"
            style={{
              left: `${w.x}%`,
              top: `${w.y}%`,
              // responsive: shrinks fluidly on small screens, capped at the design size
              fontSize: `clamp(${(w.size * 0.4).toFixed(2)}rem, ${(w.size * 2.1).toFixed(2)}vw, ${w.size}rem)`,
            }}
          >
            {w.text}
          </div>
        ))}
      </div>

      {/* product chapters */}
      {PRODUCTS.map((prod, i) => (
        <div
          key={prod.index}
          ref={(el) => {
            prodRefs.current[i].block = el;
          }}
          className="product"
          aria-hidden
        >
          <div className="product-index">PRODUCT {prod.index}</div>
          <div
            className="product-name"
            ref={(el) => {
              prodRefs.current[i].name = el;
            }}
          >
            Inc<em>{prod.name.slice(3)}</em>
          </div>
          <div className="product-sub">{prod.subtitle}</div>
          <div className="product-lines">
            {prod.lines.map((line, j) => (
              <div
                key={line}
                ref={(el) => {
                  prodRefs.current[i].lines[j] = el;
                }}
                className="product-line"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ending */}
      <div className="ending" ref={endingRef}>
        <div className="ending-tagline">
          <span>Hire Smarter.</span>
          <span>Hire Faster.</span>
          <span className="b">Hire Better.</span>
        </div>
        <div className="ending-logo">INCRUITER</div>
        <div className="ending-kicker">AI Hiring Intelligence</div>
        <div className="cta-row">
          <button className="cta primary">Book a Demo</button>
          <button className="cta">Request a Consultation</button>
          <button className="cta">Start Hiring Better Today</button>
        </div>
      </div>

      {/* chrome */}
      <header className="brand" ref={brandRef}>
        In<b>Cruiter</b>
        <span className="dot">.</span>
      </header>

      <div className="scroll-hint" ref={hintRef}>
        <span>Scroll</span>
        <div className="line" />
      </div>

      <div className="rail" ref={railRef} aria-hidden>
        {CHAPTER_MARKERS.map((m, i) => (
          <div
            key={m.label}
            ref={(el) => {
              railItemRefs.current[i] = el;
            }}
            className="rail-item"
          >
            <span className="rail-label">{m.label}</span>
            <span className="tick" />
          </div>
        ))}
      </div>

      <div className="progress-bar" ref={barRef} />

      {/* the tall scroll track that gives the film its length */}
      <div className="scroll-track" ref={trackRef} />
    </>
  );
}
