import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moog 1.0",
    short_name: "Moog",
    description: "Private temporary sharing with no account needed.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090c",
    theme_color: "#c9ff4d",
    icons: [
      { src: "/moog.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/moog.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
