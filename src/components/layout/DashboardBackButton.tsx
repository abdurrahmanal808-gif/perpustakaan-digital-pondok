"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export function DashboardBackButton() {
  const pathname = usePathname();
  const hiddenPaths = new Set(["/dashboard", "/login", "/register"]);

  if (hiddenPaths.has(pathname)) {
    return null;
  }

  return (
    <Link
      aria-label="Kembali ke Dashboard"
      className="fixed bottom-4 left-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-md border border-gold/30 bg-bone px-3 py-2 text-sm font-semibold text-ink shadow-lg shadow-pondok/10 transition hover:bg-cream focus:outline-none focus:ring-2 focus:ring-pondok/20"
      href="/dashboard"
    >
      <ArrowLeft className="sm:hidden" size={18} />
      <LayoutDashboard className="hidden sm:block" size={18} />
      <span className="hidden sm:inline">Kembali ke Dashboard</span>
    </Link>
  );
}
