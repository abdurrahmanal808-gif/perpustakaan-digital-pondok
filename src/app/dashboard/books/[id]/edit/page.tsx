import { notFound } from "next/navigation";
import { updateBook } from "@/lib/books/actions";
import { MAX_COVER_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { getActiveCategories } from "@/lib/books/queries";
import { getBookForEdit } from "@/lib/books/queries";
import { requireActiveUser } from "@/lib/auth/session";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

type EditBookPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditBookPage({
  params,
  searchParams
}: EditBookPageProps) {
  const [{ id }, query, { user }, categories] = await Promise.all([
    params,
    searchParams,
    requireActiveUser(),
    getActiveCategories()
  ]);
  const book = await getBookForEdit(id, user);

  if (!book) {
    notFound();
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Edit Buku</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">{book.title}</h1>
      </div>

      <form
        action={updateBook}
        className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm"
      >
        <input name="bookId" type="hidden" value={book.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Judul</span>
            <input
              className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
              defaultValue={book.title}
              maxLength={180}
              name="title"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Penulis</span>
            <input
              className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
              defaultValue={book.author || ""}
              maxLength={140}
              name="author"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Kategori</span>
            <select
              className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
              defaultValue={book.category_id}
              name="categoryId"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {user.role === "admin" ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
                defaultValue={book.status}
                name="status"
              >
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
          ) : (
            <input name="status" type="hidden" value="pending" />
          )}
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              {book.cover_path ? "Ganti cover" : "Tambah cover"}
            </span>
            <input
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="mt-1 w-full rounded-md border border-dashed border-gold/40 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-pondok file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              name="cover"
              type="file"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Kosongkan jika tidak ingin mengganti cover. Maksimal{" "}
              {formatBytes(MAX_COVER_UPLOAD_SIZE_BYTES)}.
            </span>
          </label>
        </div>

        {book.cover_path ? (
          <label className="mt-4 flex items-start gap-3 rounded-md bg-cream p-3 text-sm text-slate-700">
            <input className="mt-1" name="removeCover" type="checkbox" />
            <span>Hapus cover saat ini dan gunakan cover default.</span>
          </label>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Deskripsi</span>
          <textarea
            className="mt-1 min-h-32 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            defaultValue={book.description || ""}
            maxLength={1600}
            name="description"
          />
        </label>

        {query.error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {query.error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button type="submit">Simpan perubahan</Button>
        </div>
      </form>
    </section>
  );
}
