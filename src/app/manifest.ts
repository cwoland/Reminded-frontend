import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reminded — трекер задач",
    short_name: "Reminded",
    description: "Орбитальный трекер задач и времени",
    start_url: "/tasks",
    scope: "/",
    display: "standalone",
    background_color: "#05060a",
    theme_color: "#05060a",
    lang: "ru",
    categories: ["productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}