/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Frames are pre-optimized WebP served statically; skip Next image optimization.
  images: { unoptimized: true },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        // Frames are content-hashed by name and never change → cache forever.
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
