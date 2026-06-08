import Link from "next/link";
import { BookOpen, Library, Upload } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getFeaturedBooks } from "@/lib/books/queries";
import { getCoverUrlMap } from "@/lib/books/covers";
import { getCurrentUser } from "@/lib/auth/session";
import { getFavoriteIds } from "@/lib/favorites/queries";
import { BookCard } from "@/components/books/BookCard";
import { DefaultBookCover } from "@/components/books/DefaultBookCover";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();
  const books = user ? await getFeaturedBooks(4) : [];
  const [coverUrls, favoriteIds] = await Promise.all([
    getCoverUrlMap(books),
    getFavoriteIds(user?.id)
  ]);
  const catalogHref = user
    ? "/catalog"
    : "/login?error=auth_required&next=%2Fcatalog";

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-gold/20 bg-bone">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link className="text-lg font-bold text-ink" href="/">
            {APP_NAME}
          </Link>
          <div className="flex gap-2">
            <Link className={buttonClassName("secondary")} href={catalogHref}>
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
            Masuk untuk mengakses koleksi perpustakaan, membaca PDF atau scan kitab,
            menyimpan favorit, dan menyusun rak pribadi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className={buttonClassName()} href={catalogHref}>
              <Library size={18} />
              <span>{user ? "Lihat katalog" : "Masuk untuk lihat katalog"}</span>
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
          {user && books.length > 0 ? (
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
                  <div className="aspect-[3/4]">
                    <DefaultBookCover title={book.title} />
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-2 rounded-lg border border-gold/20 bg-bone p-6 text-sm leading-6 text-slate-600">
              {user
                ? "Katalog masih kosong. Buku pertama akan tampil di sini setelah admin menerbitkannya."
                : "Koleksi buku hanya tersedia setelah login. Buat akun atau masuk untuk mulai membaca."}
            </div>
          )}
        </div>
      </section>

      {user ? (
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
      ) : (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-3">
          {[
            "Katalog tertutup untuk anggota",
            "Baca PDF dan scan gambar online",
            "Favorit, rak pribadi, dan riwayat baca"
          ].map((feature) => (
            <div
              className="rounded-lg border border-gold/20 bg-bone p-5 text-sm font-semibold text-ink shadow-sm"
              key={feature}
            >
              {feature}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
