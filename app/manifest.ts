import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PI-hub",
    short_name: "PI-hub",
    description:
      "Principal Investigator Hub for eSPUD — projects, members, deadlines, and reports stored locally on your device.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#d9def5",
    theme_color: "#1c1f2e",
    orientation: "any",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192 512x512 1024x1024 2000x2000",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["productivity", "education"],
  };
}
