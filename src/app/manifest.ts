import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verdikt",
    short_name: "Verdikt",
    description: "Fais analyser une conversation : qui a tort, pourquoi, et comment mieux le dire.",
    start_url: "/analyser",
    display: "standalone",
    background_color: "#F1EFFA",
    theme_color: "#4F35F2",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
