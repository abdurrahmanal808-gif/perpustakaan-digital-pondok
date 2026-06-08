import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { DashboardBackButton } from "@/components/layout/DashboardBackButton";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Perpustakaan digital berbasis pondok untuk membaca dan berbagi buku."
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
      </body>
    </html>
  );
}
