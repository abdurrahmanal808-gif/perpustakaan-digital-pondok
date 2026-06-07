import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-gold">404</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <Link className={buttonClassName("secondary", "mt-6")} href="/">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
