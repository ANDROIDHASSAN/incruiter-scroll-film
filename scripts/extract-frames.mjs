/**
 * Extract a video into an optimized WebP frame sequence for the scroll-film.
 *
 * Usage:
 *   node scripts/extract-frames.mjs "videos/incruiter blue 1.mp4"
 *
 * Requires ffmpeg on PATH. Writes public/frames/frame_00001.webp ... and prints
 * the final frame count — update FRAME_COUNT in lib/story.ts to match.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const src = process.argv[2] || "videos/incruiter blue 1.mp4";
const outDir = resolve("public/frames");

if (!existsSync(src)) {
  console.error(`Source video not found: ${src}`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Master at 1440p (2× the 720p source) with lanczos + a light unsharp mask to
// counter upscale softness, then high-quality WebP. 1440p supersamples to look
// 4K-equivalent on any real display while staying light to decode/stream
// (the true detail ceiling is the 720p source, so 4K would add bytes, not detail).
const TARGET = "2560:1440";
console.log(`Extracting frames from ${src} at ${TARGET} ...`);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i", src,
    "-vsync", "0",
    "-vf", `scale=${TARGET}:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.9:5:5:0.0`,
    "-c:v", "libwebp",
    "-compression_level", "6",
    "-q:v", "90",
    "-preset", "picture",
    resolve(outDir, "frame_%05d.webp"),
  ],
  { stdio: "inherit" },
);

const count = readdirSync(outDir).filter((f) => f.endsWith(".webp")).length;
console.log(`\nDone. ${count} frames written to public/frames/`);
console.log(`>> Set FRAME_COUNT = ${count} in lib/story.ts`);
