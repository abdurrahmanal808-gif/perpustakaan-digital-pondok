import { requireActiveUser } from "@/lib/auth/session";
import { getCoverUrlMap } from "@/lib/books/covers";
import { getMyBooks } from "@/lib/books/queries";
import { BookCard } from "@/components/books/BookCard";

export const dynamic = "force-dynamic";

export default async function MyBooksPage() {
  const { user } = await requireActiveUser();
  const books = await getMyBooks(user.id);
  const coverUrls = await getCoverUrlMap(books);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Dashboard User</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Buku Saya</h1>
      </div>

      {books.length > 0 ? (
        <div className="grid gap-4">
          {books.map((book) => (
            <BookCard
              book={book}
              coverUrl={coverUrls.get(book.id)}
              key={book.id}
              showManage
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gold/20 bg-bone p-6 text-sm text-slate-600">
          Belum ada buku yang Anda upload.
        </div>
      )}
    </section>
  );
}
