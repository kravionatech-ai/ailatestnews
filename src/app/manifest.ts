import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Latest News — India's AI Portal",
    short_name: "AILatestNews",
    description: "Breaking AI news, LLM benchmarks, tool comparisons & Indian AI ecosystem coverage.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
