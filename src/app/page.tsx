import Link from "next/link";
import { BookOpen, Library, Upload } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getFeaturedBooks } from "@/lib/books/queries";
import { getCoverUrlMap } from "@/lib/books/covers";
import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteIds } from "@/lib/favorites/queries";
import { BookCard } from "@/components/books/BookCard";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [books, user] = await Promise.all([getFeaturedBooks(4), getCurrentUser()]);
  const [coverUrls, favoriteIds] = await Promise.all([
    getCoverUrlMap(books),
    getFavoriteIds(user?.id)
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-gold/20 bg-bone">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link className="text-lg font-bold text-ink" href="/">
            {APP_NAME}
          </Link>
          <div className="flex gap-2">
            <Link className={buttonClassName("secondary")} href="/catalog">
              Katalog
            </Link>
            <Link
              className={buttonClassName()}
              href={user ? "/dashboard" : "/login"}
            >
              {user ? "Dashboard" : "Masuk"}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-gold">Pondok, kitab, dan bacaan digital</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Perpustakaan digital untuk membaca dan berbagi buku dengan tertib.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            Upload PDF atau scan kitab, simpan favorit, susun rak pribadi, dan baca
            langsung dari browser.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className={buttonClassName()} href="/catalog">
              <Library size={18} />
              <span>Lihat katalog</span>
            </Link>
            <Link
              className={buttonClassName("secondary")}
              href={user ? "/dashboard/books/upload" : "/register"}
            >
              <Upload size={18} />
              <span>Upload buku</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {books.length > 0 ? (
            books.slice(0, 4).map((book) => (
              <Link
                className="overflow-hidden rounded-lg border border-gold/20 bg-bone shadow-sm"
                href={`/books/${book.id}`}
                key={book.id}
              >
                {coverUrls.get(book.id) ? (
                  <img
                    alt={`Cover ${book.title}`}
                    className="aspect-[3/4] w-full object-cover"
                    src={coverUrls.get(book.id)}
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-cream p-4 text-center text-sm font-semibold text-clay">
                    {book.title}
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-2 rounded-lg border border-gold/20 bg-bone p-6 text-sm leading-6 text-slate-600">
              Katalog masih kosong. Buku pertama akan tampil di sini setelah admin
              menerbitkannya.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-5 flex items-center gap-2">
          <BookOpen size={20} className="text-gold" />
          <h2 className="text-xl font-bold text-ink">Buku terbaru</h2>
        </div>
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
      </section>
    </main>
  );
}
