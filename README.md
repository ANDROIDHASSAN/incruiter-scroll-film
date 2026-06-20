# InCruiter — Scroll Film

A single-page cinematic experience: the entire site is **one seamless, scroll-controlled film**. There are no sections, cards, grids, or SaaS layouts — only an atmospheric video that the user *scrubs* by scrolling, with narrative typography that emerges, reacts, and dissolves over it.

Built from one source video: `videos/incruiter blue 1.mp4`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

`ffmpeg` is only needed if you want to re-extract frames (see below). The frames are already committed under `public/frames/`.

## How it works

The video is **not** played as HTML5 `<video>`. It is pre-exported to a WebP **frame sequence** and rendered to a `<canvas>`, frame-by-frame, driven by scroll position. This gives precise, reversible, jank-free scrubbing.

- **Frame pipeline** — `lib/FrameLoader.ts` streams WebP frames as `<img>` elements: the browser holds the *encoded* bytes (~50 MB for the whole film) and only keeps the *decoded* surface for frames actually painted, evicting the rest. That keeps a 1440p film safe on phones, where decoding+retaining all 361 frames as bitmaps would need gigabytes of RAM. It warms a lead-in so the hero is sharp instantly, then background-streams the rest with predictive buffering around the playhead.
- **Renderer** — `components/ScrollFilm.tsx` runs one `requestAnimationFrame` loop that: maps scroll progress → frame, draws it with **frame-blending** (cross-fades adjacent frames by fractional position for perceived smoothness well beyond the native frame count), and imperatively animates every text overlay (no React re-renders).
- **Smooth scroll** — [Lenis](https://github.com/darkroomengineering/lenis) provides momentum/eased scrolling and the `progress` + `velocity` signals used for velocity-reactive typography.
- **Story** — `lib/story.ts` holds the entire narrative as scroll-progress (0..1) windows: 11 chapters of copy, the overlapping "noise" word field, the six products, the transformation, and the ending CTAs.
- **Atmosphere** — film grain, cinematic vignette, chromatic softness, a per-beat **text-scrim** that dims the busy film (and its own baked-in captions) for legibility, a chapter progress rail, and a top progress bar.

## Tech

Next.js 15 · React 19 · TypeScript · GSAP · Lenis · GPU canvas rendering · `requestAnimationFrame` · `<img>`-streamed WebP frame pipeline · device-adaptive (DPR cap, frame-blend toggle, buffer sizing).

## A note on resolution (source is 720p)

All three source videos are **1280×720, 24fps, 15s = 361 frames**. The film is mastered to **2560×1440** (`scripts/extract-frames.mjs`: lanczos upscale + light unsharp mask + high-quality WebP, ~50 MB total for 361 frames).

Why 1440p and not literal 4K: the *real detail ceiling is the 720p source*, so a 4K export adds bytes, not detail. 1440p is 2× the source, and the renderer **supersamples** it down to the display with high-quality smoothing (`imageSmoothingQuality = "high"`) — on any real screen it looks 4K-equivalent and sharp, while decoding fast and staying smooth on phones. (A true 4K frame is 33 MB of *uncompressed* RAM each; keeping a film's worth of them decoded would need multiple GB. 1440p + `<img>` streaming keeps memory bounded.) If a genuine high-res master is ever provided, just re-extract at its native resolution.

## Swapping the video / re-extracting frames

```bash
npm run frames:extract -- "videos/incruiterblue2.mp4"
```

This rewrites `public/frames/` and prints the new frame count — update `FRAME_COUNT` in `lib/story.ts` to match. The chapter copy and progress windows live in the same file.
