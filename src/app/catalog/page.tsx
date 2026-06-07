import { getCurrentUser } from "@/lib/auth/session";
import { getCoverUrlMap } from "@/lib/books/covers";
import { getActiveCategories, getPublicBooks } from "@/lib/books/queries";
import { getFavoriteIds } from "@/lib/favorites/queries";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: "pdf" | "scan" | "";
    sort?: "newest" | "popular" | "downloads";
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const [books, categories, user] = await Promise.all([
    getPublicBooks({
      search: params.q,
      category: params.category,
      type: params.type || "",
      sort: params.sort || "newest"
    }),
    getActiveCategories(),
    getCurrentUser()
  ]);
  const [coverUrls, favoriteIds] = await Promise.all([
    getCoverUrlMap(books),
    getFavoriteIds(user?.id)
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gold">Katalog publik</p>
            <h1 className="mt-1 text-3xl font-bold text-ink">Buku Terbit</h1>
          </div>
        </div>

        <form className="mb-6 grid gap-3 rounded-lg border border-gold/20 bg-bone p-4 md:grid-cols-[1fr_180px_160px_180px_auto]">
          <input
            className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            defaultValue={params.q}
            name="q"
            placeholder="Cari judul, penulis, deskripsi"
          />
          <select
            className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            defaultValue={params.category || ""}
            name="category"
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            defaultValue={params.type || ""}
            name="type"
          >
            <option value="">Semua jenis</option>
            <option value="pdf">PDF</option>
            <option value="scan">Scan</option>
          </select>
          <select
            className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            defaultValue={params.sort || "newest"}
            name="sort"
          >
            <option value="newest">Terbaru</option>
            <option value="popular">Terpopuler</option>
            <option value="downloads">Download terbanyak</option>
          </select>
          <Button type="submit">Cari</Button>
        </form>

        {books.length > 0 ? (
          <div className="grid gap-4">
            {books.map((book) => (
              <BookCard
                book={book}
                coverUrl={coverUrls.get(book.id)}
                favoriteActive={user ? favoriteIds.has(book.id) : undefined}
                key={book.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gold/20 bg-bone p-6 text-sm text-slate-600">
            Belum ada buku yang cocok.
          </div>
        )}
      </section>
    </main>
  );
}
