import Link from "next/link";
import { ShieldCheck, Upload } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/format";

export default function UploadRulesPage() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
          <p className="text-sm font-semibold text-gold">Aturan Upload</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            Berbagi buku dengan aman dan bertanggung jawab
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Perpustakaan Digital Pondok dibuat untuk memudahkan akses bacaan.
            Setiap uploader wajib memastikan file yang dibagikan boleh
            dipublikasikan.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-4">
              <ShieldCheck className="text-gold" size={24} />
              <h2 className="mt-3 font-bold text-ink">Hak dan izin</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload hanya file yang Anda miliki, berada di domain publik, atau
                memang Anda punya izin untuk membagikannya.
              </p>
            </div>

            <div className="rounded-lg bg-white p-4">
              <Upload className="text-gold" size={24} />
              <h2 className="mt-3 font-bold text-ink">Format dan ukuran</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                File buku boleh PDF atau scan gambar JPG, JPEG, PNG, WEBP.
                Total ukuran upload maksimal {formatBytes(MAX_UPLOAD_SIZE_BYTES)}.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-cream p-4">
            <h2 className="font-bold text-ink">Moderasi yang dipakai</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Pilihan paling aman untuk aplikasi publik adalah status awal
              <strong> pending</strong>. Buku tidak langsung tampil di katalog
              sampai admin menerbitkannya. Alternatifnya adalah langsung publish
              dengan fitur report/moderasi setelah terbit, tetapi risiko konten
              bermasalah tampil ke publik lebih besar.
            </p>
          </div>

          <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">
            <p>Status buku yang tersedia: published, pending, hidden, deleted.</p>
            <p>Admin dapat menyembunyikan atau menghapus buku dan memblokir user.</p>
            <p>User hanya boleh mengedit atau menghapus buku miliknya sendiri.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link className={buttonClassName()} href="/dashboard/books/upload">
              Upload buku
            </Link>
            <Link className={buttonClassName("secondary")} href="/catalog">
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
