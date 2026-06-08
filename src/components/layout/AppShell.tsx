"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Clock,
  Heart,
  LayoutDashboard,
  Library,
  ListTree,
  ShieldCheck,
  Upload,
  UserRound
} from "lucide-react";
import { clsx } from "clsx";
import { LogoutButton } from "@/components/layout/LogoutButton";
import type { UserRole } from "@/lib/db/types";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/catalog",
    label: "Katalog",
    icon: Library
  },
  {
    href: "/dashboard/books",
    label: "Buku Saya",
    icon: BookMarked
  },
  {
    href: "/dashboard/books/upload",
    label: "Upload",
    icon: Upload
  },
  {
    href: "/dashboard/favorites",
    label: "Favorit",
    icon: Heart
  },
  {
    href: "/dashboard/shelves",
    label: "Rak",
    icon: BookMarked
  },
  {
    href: "/dashboard/history",
    label: "Riwayat",
    icon: Clock
  },
  {
    href: "/dashboard/profile",
    label: "Profil",
    icon: UserRound
  }
];

type AppShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  role?: UserRole;
};

export function AppShell({ children, userName, role }: AppShellProps) {
  const pathname = usePathname();
  const visibleNavItems =
    role === "admin"
      ? [
          ...navItems,
          {
            href: "/admin",
            label: "Admin",
            icon: ShieldCheck
          },
          {
            href: "/admin/categories",
            label: "Kategori",
            icon: ListTree
          }
        ]
      : navItems;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-gold/20 bg-bone">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link className="text-lg font-bold text-ink" href="/dashboard">
              Perpustakaan Digital Pondok
            </Link>
            <p className="mt-1 text-sm text-slate-600">@{userName}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap gap-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    className={clsx(
                      "inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-pondok text-white"
                        : "text-slate-700 hover:bg-cream"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
