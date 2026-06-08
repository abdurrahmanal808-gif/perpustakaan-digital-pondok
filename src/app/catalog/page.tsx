import { requireActiveUser } from "@/lib/auth/session";
import { getCoverUrlMap } from "@/lib/books/covers";
import {
  getCachedActiveCategories,
  getCachedPublicBookPage
} from "@/lib/books/queries";
import { getFavoriteIds } from "@/lib/favorites/queries";
import { BookCard } from "@/components/books/BookCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { Library } from "lucide-react";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: "pdf" | "scan" | "";
    sort?: "newest" | "popular" | "downloads";
    page?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const page = Math.max(Number(params.page || "1") || 1, 1);
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.sort) query.set("sort", params.sort);
  if (page > 1) query.set("page", String(page));

  const nextPath = `/catalog${query.toString() ? `?${query.toString()}` : ""}`;
  const { user } = await requireActiveUser(nextPath);
  const [bookPage, categories] = await Promise.all([
    getCachedPublicBookPage({
      search: params.q,
      category: params.category,
      type: params.type || "",
      sort: params.sort || "newest",
      page
    }),
    getCachedActiveCategories()
  ]);
  const { books, totalBooks, totalPages, perPage } = bookPage;
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
            <p className="mt-2 text-sm text-slate-600">
              {totalBooks} buku ditemukan
            </p>
          </div>
        </div>

        <CatalogFilters
          categories={categories}
          defaultValues={{
            q: params.q,
            category: params.category,
            type: params.type || "",
            sort: params.sort || "newest"
          }}
        />

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
          <div className="rounded-lg border border-gold/20 bg-bone p-8 text-center shadow-sm">
            <Library className="mx-auto text-gold" size={40} />
            <h2 className="mt-4 text-lg font-bold text-ink">
              Belum ada buku yang cocok
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Coba ubah kata kunci, kategori, jenis file, atau urutan katalog.
            </p>
          </div>
        )}

        <CatalogPagination
          currentPage={page}
          perPage={perPage}
          searchParams={{
            q: params.q,
            category: params.category,
            type: params.type,
            sort: params.sort
          }}
          totalBooks={totalBooks}
          totalPages={totalPages}
        />
      </section>
    </main>
  );
}
