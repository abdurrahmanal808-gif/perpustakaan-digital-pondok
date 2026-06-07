import { getActiveCategories } from "@/lib/books/queries";
import { UploadBookForm } from "@/components/books/UploadBookForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UploadBookPage() {
  const categories = await getActiveCategories();

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Upload Buku</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Tambah Buku Baru</h1>
        <p className="mt-2 text-sm text-slate-600">
          Baca{" "}
          <Link className="font-semibold text-pondok hover:text-leaf" href="/aturan-upload">
            aturan upload
          </Link>{" "}
          sebelum mengirim file.
        </p>
      </div>
      <UploadBookForm categories={categories} />
    </section>
  );
}
