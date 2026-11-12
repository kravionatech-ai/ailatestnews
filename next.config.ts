import type { NextConfig } from "next";

const rawVercelProdHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL || "")
  .trim()
  .toLowerCase();
const customVercelProdHost =
  rawVercelProdHost &&
  !rawVercelProdHost.endsWith(".vercel.app") &&
  rawVercelProdHost !== "localhost"
    ? rawVercelProdHost
    : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Ensure canonical links, RSS autodiscovery, and SEO meta tags always render inside <head> rather than streaming into <body>
  htmlLimitedBots: /.*/,
  env: {
    ...(customVercelProdHost
      ? { NEXT_PUBLIC_VERCEL_PRODUCTION_URL: customVercelProdHost }
      : {}),
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/(icon.svg|manifest.webmanifest)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source:
          "/(sitemap.xml|sitemap-static.xml|sitemap-articles.xml|sitemap-categories.xml|sitemap-tags.xml|sitemap-pages.xml|sitemap-custom.xml|image-sitemap.xml|news-sitemap.xml|sitemap-news.xml|feed.xml|robots.txt)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-icons",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "clsx",
      "framer-motion",
      "lucide-react",
      "tailwind-merge",
    ],
  },
};

export default nextConfig;
