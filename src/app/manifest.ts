import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kraviona AI News — AI, Technology & Research Intelligence",
    short_name: "Kraviona AI",
    description:
      "International digital intelligence publication covering AI models, research papers, AI tools, startups, cybersecurity, and emerging technology.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F4EF",
    theme_color: "#101820",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
