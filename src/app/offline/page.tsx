import Link from "next/link";
import { WifiOff } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-10 text-ink">
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-bone text-pondok shadow-sm">
          <WifiOff size={30} />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-gold">
          Sedang Offline
        </p>
        <h1 className="mt-2 text-3xl font-bold">Koneksi internet terputus</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Beberapa halaman membutuhkan koneksi untuk mengambil data buku dan file
          dari server. Sambungkan internet lalu coba buka kembali.
        </p>
        <Link className={buttonClassName("secondary") + " mt-6"} href="/dashboard">
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}
