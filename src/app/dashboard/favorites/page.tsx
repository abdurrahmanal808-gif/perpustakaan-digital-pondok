import { getCoverUrlMap } from "@/lib/books/covers";
import { getFavoritesPage } from "@/lib/favorites/queries";
import { BookCard } from "@/components/books/BookCard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const books = await getFavoritesPage();
  const coverUrls = await getCoverUrlMap(books);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Rak cepat</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Favorit</h1>
      </div>
      {books.length > 0 ? (
        <div className="grid gap-4">
          {books.map((book) => (
            <BookCard
              book={book}
              coverUrl={coverUrls.get(book.id)}
              favoriteActive
              key={book.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gold/20 bg-bone p-6 text-sm text-slate-600">
          Belum ada buku favorit.
        </div>
      )}
    </section>
  );
}
