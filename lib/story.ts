/**
 * The entire narrative timeline, expressed as scroll-progress (0..1) windows.
 * Every beat is positioned by `from`/`to` on the global scroll progress and
 * is rendered/animated imperatively (no React re-renders) for performance.
 */

export type RevealKind = "rise" | "fall" | "blur" | "scale" | "track";

export interface Beat {
  id: string;
  text: string;
  /** Optional smaller kicker shown above the main line. */
  kicker?: string;
  /** Visual scale tier. */
  size: "xl" | "lg" | "md" | "sm";
  from: number;
  to: number;
  reveal?: RevealKind;
  /** Horizontal alignment of the block. */
  align?: "center" | "left";
  /** Subtle accent (blue) on this line. */
  accent?: boolean;
}

export interface NoiseWord {
  text: string;
  /** position in viewport units */
  x: number; // 0..100 (%)
  y: number; // 0..100 (%)
  size: number; // rem
  from: number;
  to: number;
  opacity: number;
}

export interface ProductChapter {
  index: string; // "01"
  name: string;
  subtitle: string;
  from: number;
  to: number;
  lines: string[];
}

// ── Chapter 1 — The Problem (0–12%) ──────────────────────────────────────────
// ── Chapter 3 — Introducing (24–36%) ─────────────────────────────────────────
// ── Chapter 10 — Transformation (84–94%) ─────────────────────────────────────
// ── Chapter 11 — Ending (94–100%) ────────────────────────────────────────────
export const BEATS: Beat[] = [
  // Chapter 1 — The Problem
  { id: "c1a", text: "Every hiring process\nbegins with potential.", size: "xl", from: 0.012, to: 0.05, reveal: "blur" },
  { id: "c1b", text: "But potential\nis difficult to recognize.", size: "xl", from: 0.05, to: 0.088, reveal: "blur" },
  { id: "c1c", text: "Thousands apply.", size: "lg", from: 0.088, to: 0.106, reveal: "rise" },
  { id: "c1d", text: "Most seem qualified.", size: "lg", from: 0.106, to: 0.123, reveal: "rise" },
  { id: "c1e", text: "Few are truly right.", size: "xl", from: 0.123, to: 0.146, reveal: "scale" },

  // Chapter 3 — Introducing InCruiter
  { id: "c3a", text: "What if hiring\ncould become evidence?", size: "xl", from: 0.246, to: 0.295, reveal: "blur" },
  { id: "c3b", text: "Meet InCruiter.", size: "xl", from: 0.297, to: 0.327, reveal: "scale", accent: true },
  { id: "c3c", text: "AI Hiring Intelligence.", size: "lg", from: 0.328, to: 0.345, reveal: "rise" },
  { id: "c3d", text: "Built for modern recruitment.", size: "md", from: 0.345, to: 0.362, reveal: "rise" },

  // Chapter 10 — The Transformation
  { id: "c10a", text: "10 candidates enter.", size: "xl", from: 0.845, to: 0.866, reveal: "rise" },
  { id: "c10b", text: "9 are eliminated.", size: "xl", from: 0.866, to: 0.886, reveal: "rise" },
  { id: "c10c", text: "1 stands out.", size: "xl", from: 0.886, to: 0.908, reveal: "scale", accent: true },
  { id: "c10d", text: "Not because of luck.", size: "lg", from: 0.908, to: 0.924, reveal: "rise" },
  { id: "c10e", text: "Because of evidence.", size: "lg", from: 0.924, to: 0.938, reveal: "rise" },
  { id: "c10f", text: "Because of intelligence.", size: "lg", from: 0.938, to: 0.952, reveal: "rise" },
  { id: "c10g", text: "Because of InCruiter.", size: "xl", from: 0.952, to: 0.974, reveal: "scale", accent: true },
];

// Chapter 2 — The Noise (12–24%): overlapping words that build pressure.
export const NOISE_WORDS: NoiseWord[] = [
  { text: "Resumes.", x: 22, y: 30, size: 5.5, from: 0.150, to: 0.232, opacity: 0.9 },
  { text: "Keywords.", x: 64, y: 24, size: 4.2, from: 0.158, to: 0.232, opacity: 0.7 },
  { text: "Assumptions.", x: 38, y: 58, size: 6.2, from: 0.166, to: 0.232, opacity: 0.85 },
  { text: "Bias.", x: 76, y: 62, size: 7.5, from: 0.174, to: 0.232, opacity: 0.95 },
  { text: "Guesswork.", x: 14, y: 70, size: 4.6, from: 0.182, to: 0.232, opacity: 0.6 },
  { text: "Manual reviews.", x: 52, y: 40, size: 5.0, from: 0.190, to: 0.232, opacity: 0.8 },
  { text: "Endless interviews.", x: 30, y: 84, size: 4.0, from: 0.198, to: 0.232, opacity: 0.55 },
  { text: "Slow decisions.", x: 70, y: 80, size: 4.8, from: 0.206, to: 0.232, opacity: 0.7 },
  { text: "Bad hires.", x: 46, y: 18, size: 8.0, from: 0.214, to: 0.238, opacity: 1.0 },
];

// Chapters 4–9 — The six products.
export const PRODUCTS: ProductChapter[] = [
  {
    index: "01",
    name: "IncScreen",
    subtitle: "AI Candidate Screening",
    from: 0.362,
    to: 0.44,
    lines: ["Screen thousands.", "Identify top talent instantly.", "Reduce manual effort."],
  },
  {
    index: "02",
    name: "IncBot",
    subtitle: "AI Interview Assistant",
    from: 0.44,
    to: 0.52,
    lines: ["Conduct structured interviews.", "Maintain consistency.", "Capture deeper insights.", "Improve decision quality."],
  },
  {
    index: "03",
    name: "IncVid",
    subtitle: "Video Interview Platform",
    from: 0.52,
    to: 0.60,
    lines: ["Assess communication.", "Evaluate confidence.", "Review candidates at scale.", "Make interviews asynchronous."],
  },
  {
    index: "04",
    name: "IncFeed",
    subtitle: "Candidate Intelligence Engine",
    from: 0.60,
    to: 0.68,
    lines: ["Transform data into insight.", "Centralize candidate feedback.", "Make smarter hiring decisions."],
  },
  {
    index: "05",
    name: "IncServe",
    subtitle: "Recruitment Operations Platform",
    from: 0.68,
    to: 0.76,
    lines: ["Manage workflows.", "Automate coordination.", "Scale hiring processes."],
  },
  {
    index: "06",
    name: "IncProctor",
    subtitle: "Integrity Monitoring System",
    from: 0.76,
    to: 0.84,
    lines: ["Protect assessments.", "Ensure authenticity.", "Maintain trust."],
  },
];

// Chapter labels for the side progress rail.
export const CHAPTER_MARKERS: { at: number; label: string }[] = [
  { at: 0.0, label: "The Problem" },
  { at: 0.15, label: "The Noise" },
  { at: 0.24, label: "InCruiter" },
  { at: 0.362, label: "IncScreen" },
  { at: 0.44, label: "IncBot" },
  { at: 0.52, label: "IncVid" },
  { at: 0.60, label: "IncFeed" },
  { at: 0.68, label: "IncServe" },
  { at: 0.76, label: "IncProctor" },
  { at: 0.84, label: "Transformation" },
  { at: 0.94, label: "Hire Better" },
];

export const FRAME_COUNT = 361;
export const FRAME_PATH = (i: number) => `/frames/frame_${String(i).padStart(5, "0")}.webp`;
