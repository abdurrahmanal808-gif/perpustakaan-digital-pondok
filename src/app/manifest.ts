import type { MetadataRoute } from "next";
import { APP_INSTALL_NAME, APP_SHORT_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_INSTALL_NAME,
    short_name: APP_SHORT_NAME,
    description:
      "Aplikasi perpustakaan digital pondok untuk membaca dan mengelola koleksi buku.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8ee",
    theme_color: "#16452f",
    orientation: "portrait-primary",
    lang: "id-ID",
    categories: ["books", "education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
