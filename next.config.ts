import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  experimental: {
    // Server Actions are stable in Next 16; keep body size generous for attachments metadata.
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Client router cache: re-visiting a page within this window is instant
    // (served from cache, no server round-trip). Mutations call router.refresh()
    // / revalidatePath, so data still updates immediately after you change it.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
