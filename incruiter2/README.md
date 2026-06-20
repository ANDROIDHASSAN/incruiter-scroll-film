# InCruiter — Scroll-Driven Cinematic Site

A single-page, ~30-second scroll-driven cinematic experience for **InCruiter**, an
AI-powered interview & hiring platform. The brand film is **scrubbed by scroll** — the
playhead is bound to scroll position, not autoplay — over kinetic typography, a
velocity-driven liquid WebGL layer, animated counters, and a pinned product gallery.

## Stack

- **Vite + React 18 + TypeScript**
- **GSAP + ScrollTrigger** — master timeline & scroll-scrubbing (source of truth)
- **Lenis** — inertial smooth scroll (owns scroll position; GSAP reads from it)
- **Framer Motion** — state-driven micro-interactions only (magnetic CTA, cursor)
- **ogl** — lightweight WebGL liquid distortion + chromatic aberration
- **split-type** — kinetic typography

## The smooth scroll-scrubbed film (the core)

The single most important detail. The film is controlled by scroll, and stays smooth
because of three things working together:

1. **All-keyframe (all-intra) encode** — `incruiterblue2-seq.mp4` is encoded with
   `-g 1` so **every one of its 361 frames is an independent keyframe**. Any
   `currentTime` seek decodes a single self-contained frame with no stall. This is the
   difference between buttery scrubbing and the typical janky scroll-video.
2. **Damped seek** — scroll sets a `target` time; a per-frame lerp glides `current`
   toward it (`+= (target - current) * 0.18`) so the playhead never snaps.
3. **One RAF + seek-backlog guard** — the seek loop runs on **GSAP's single shared
   ticker** (the same one that drives Lenis — no competing RAF loops), and a `seeking`
   flag ensures a new seek is never queued before the last resolves.

See [`src/components/ScrollVideo.tsx`](src/components/ScrollVideo.tsx) and
[`src/lib/smoothScroll.ts`](src/lib/smoothScroll.ts).

### Why it stays sharp (never blurry)

- Source resolution (1280×720) is preserved — never upscaled.
- No `transform: scale()` > 1 and no `filter: blur()` on the film.
- WebGL canvas DPR is capped at 2 (crisp but cheap); cover-fit is done in the shader so
  the film never stretches or letterboxes.

## The seven beats

1. **Hook** — "Hiring is broken." materializes (kinetic chars).
2. **Problem** — stat lines drift horizontally at opposing speeds.
3. **Turn** — a cyan light bar wipes; "What if interviews ran themselves?"
4. **Products** — pinned horizontal gallery; the centred card sharpens (IncServe,
   IncBot, IncVid, IncScreen, IncFeed, IncExit). Mobile stacks vertically.
5. **Proof** — oversized counters race up (4×, 80%, 6 hrs, 4,500+, 600+, 4.7/5).
6. **Vision** — everything calms; type clears in from a gentle blur.
7. **CTA** — magnetic "Book a demo" + the product wordmark constellation.

All copy lives in [`src/data/content.ts`](src/data/content.ts).

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build to /dist
npm run preview   # serve the build at http://localhost:4173
```

## Performance & accessibility

- Single RAF (Lenis driven by the GSAP ticker) — no duplicate scroll loops.
- Only `transform` / `opacity` are animated; code-split chunks (gsap / motion / webgl).
- `content-visibility: auto` on below-the-fold sections.
- WebGL is enabled only on devices with > 4 cores and when motion is welcome; otherwise
  the crisp scrubbed `<video>` is the baseline (never a black box — the poster covers
  first paint).
- `prefers-reduced-motion`: Lenis inertia off, scrubbing off (static first frame),
  reveals become instant, liquid amplitude → 0.
- All narrative copy is real DOM text (SEO + screen readers); film/canvas are
  `aria-hidden`. Skip link, focus-visible CTA, JSON-LD `Organization` data.

## Media assets

| File | Purpose |
| --- | --- |
| `public/videos/incruiterblue2-seq.mp4` | All-keyframe H.264 for smooth scrubbing |
| `public/videos/incruiterblue2-poster.jpg` | Full-res poster (LCP element, preloaded) |

Re-encode from a new source with:

```bash
ffmpeg -i src.mp4 -c:v libx264 -preset slow -crf 20 \
  -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart -an public/videos/incruiterblue2-seq.mp4

ffmpeg -ss 2 -i src.mp4 -vframes 1 -q:v 2 public/videos/incruiterblue2-poster.jpg
```

> Fonts use a tuned system stack (zero network, no FOUT). To self-host Satoshi / Clash /
> General Sans, drop the `woff2` into `public/fonts/` and update `--font-display` in
> [`src/styles/globals.css`](src/styles/globals.css) — no markup changes needed.
