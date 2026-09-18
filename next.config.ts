import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        // Allow locally uploaded images served from this server over HTTP
        protocol: "http",
        hostname: "**",
      },
    ],
    // Serve /uploads/ files unoptimized so they are always served as-is
    // from public/uploads/ regardless of Next.js image optimization settings.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Allow all clients (any IP/device on the network) to load uploaded images
        source: "/uploads/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
