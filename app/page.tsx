import ScrollFilm from "@/components/ScrollFilm";

export default function Home() {
  return (
    <main>
      <ScrollFilm />
      <noscript>
        <div style={{ padding: "4rem", fontFamily: "sans-serif" }}>
          <h1>InCruiter — AI Hiring Intelligence</h1>
          <p>This cinematic experience requires JavaScript. Hire Smarter. Hire Faster. Hire Better.</p>
        </div>
      </noscript>
    </main>
  );
}
