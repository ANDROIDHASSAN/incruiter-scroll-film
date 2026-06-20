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

console.log(`Extracting frames from ${src} ...`);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i", src,
    "-vsync", "0",
    "-vf", "scale=1280:720:flags=lanczos",
    "-c:v", "libwebp",
    "-compression_level", "6",
    "-q:v", "82",
    "-preset", "picture",
    resolve(outDir, "frame_%05d.webp"),
  ],
  { stdio: "inherit" },
);

const count = readdirSync(outDir).filter((f) => f.endsWith(".webp")).length;
console.log(`\nDone. ${count} frames written to public/frames/`);
console.log(`>> Set FRAME_COUNT = ${count} in lib/story.ts`);
