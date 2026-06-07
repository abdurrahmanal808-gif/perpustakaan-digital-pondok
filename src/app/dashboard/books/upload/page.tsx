import { getActiveCategories } from "@/lib/books/queries";
import { UploadBookForm } from "@/components/books/UploadBookForm";

export const dynamic = "force-dynamic";

export default async function UploadBookPage() {
  const categories = await getActiveCategories();

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Upload Buku</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Tambah Buku Baru</h1>
      </div>
      <UploadBookForm categories={categories} />
    </section>
  );
}
