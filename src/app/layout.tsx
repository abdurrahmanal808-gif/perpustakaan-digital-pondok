import type { Metadata, Viewport } from "next";
import { APP_INSTALL_NAME, APP_NAME } from "@/lib/constants";
import { DashboardBackButton } from "@/components/layout/DashboardBackButton";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
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
    icon: "/icons/app-icon.svg",
    apple: "/icons/app-icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: APP_INSTALL_NAME,
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#16452f",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
        <DashboardBackButton />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
