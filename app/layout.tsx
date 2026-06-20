import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InCruiter — AI Hiring Intelligence",
  description:
    "A cinematic scroll-film. Hiring, transformed into evidence. Meet the InCruiter hiring intelligence ecosystem.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#05070d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Hero frame: load with high priority so the first paint is instant (no loader). */}
        <link rel="preload" as="image" href="/frames/frame_00001.webp" fetchPriority="high" />
        {/* Progressive enhancement: premium type when online, graceful system fallback otherwise. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
