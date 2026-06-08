import type { Metadata, Viewport } from "next";
import { APP_INSTALL_NAME, APP_NAME } from "@/lib/constants";
import { DashboardBackButton } from "@/components/layout/DashboardBackButton";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`
  },
  description:
    "Perpustakaan digital berbasis pondok untuk membaca dan berbagi buku.",
  applicationName: APP_INSTALL_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/app-icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }]
  },
  appleWebApp: {
    capable: true,
    title: APP_INSTALL_NAME,
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": APP_INSTALL_NAME
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16452f" },
    { media: "(prefers-color-scheme: dark)", color: "#09110d" }
  ],
  colorScheme: "light dark"
};

const themeScript = `
(() => {
  try {
    const key = "maktabah-theme";
    const stored = localStorage.getItem(key);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {}
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <DashboardBackButton />
        <ThemeToggle />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
