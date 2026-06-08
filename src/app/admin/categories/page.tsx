import {
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory
} from "@/lib/admin/actions";
import { getCategoriesWithBookCount } from "@/lib/books/queries";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminCategoriesPage({
  searchParams
}: AdminCategoriesPageProps) {
  const [categories, query] = await Promise.all([
    getCategoriesWithBookCount(),
    searchParams
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Manajemen Kategori</h1>
        <p className="mt-2 text-sm text-slate-600">
          Slug diperbarui otomatis dari nama kategori. Buku lama tetap aman karena
          relasi memakai ID kategori.
        </p>
      </div>

      {query.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {query.success}
        </div>
      ) : null}

      <form
        action={adminCreateCategory}
        className="grid gap-3 rounded-lg border border-gold/20 bg-bone p-4 md:grid-cols-[220px_1fr_auto]"
      >
        <input
          className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
          name="name"
          placeholder="Nama kategori"
          required
        />
        <input
          className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
          name="description"
          placeholder="Deskripsi"
        />
        <Button type="submit">Tambah</Button>
      </form>

      <div className="grid gap-4">
        {categories.map((category) => (
          <article
            className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm"
            key={category.id}
          >
            <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
              <p>
                <span className="font-semibold text-ink">Slug:</span> {category.slug}
              </p>
              <p>
                <span className="font-semibold text-ink">Status:</span>{" "}
                {category.is_active ? "Aktif" : "Nonaktif"}
              </p>
              <p>
                <span className="font-semibold text-ink">Jumlah buku:</span>{" "}
                {category.book_count}
              </p>
              <p>
                <span className="font-semibold text-ink">Dibuat:</span>{" "}
                {formatDate(category.created_at)}
              </p>
            </div>
            <form
              action={adminUpdateCategory}
              className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto]"
            >
              <input name="categoryId" type="hidden" value={category.id} />
              <input
                className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                defaultValue={category.name}
                name="name"
                required
              />
              <input
                className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                defaultValue={category.description || ""}
                name="description"
              />
              <label className="flex min-h-10 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm">
                <input
                  defaultChecked={category.is_active}
                  name="isActive"
                  type="checkbox"
                />
                Aktif
              </label>
              <Button type="submit" variant="secondary">
                Simpan
              </Button>
            </form>
            <form action={adminDeleteCategory} className="mt-2">
              <input name="categoryId" type="hidden" value={category.id} />
              <Button type="submit" variant="danger">
                Hapus
              </Button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
