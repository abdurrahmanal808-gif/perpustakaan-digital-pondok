import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Heart, Library } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { getFavoriteIds } from "@/lib/favorites/queries";
import { toggleFavorite } from "@/lib/favorites/actions";
import { getShelves } from "@/lib/shelves/queries";
import { addBookToShelf } from "@/lib/shelves/actions";
import { formatDisplayTitle } from "@/lib/format";
import { buttonClassName, Button } from "@/components/ui/Button";
import { BookReader } from "@/components/books/BookReader";

export const dynamic = "force-dynamic";

type ReadBookPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReadBookPage({ params }: ReadBookPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const book = await getBookDetail(id, user);

  if (!book) {
    notFound();
  }

  const [favoriteIds, shelves] = await Promise.all([
    getFavoriteIds(user?.id),
    user ? getShelves(user.id) : Promise.resolve([])
  ]);
  const title = formatDisplayTitle(book.title);
  const isFavorite = favoriteIds.has(book.id);

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto max-w-7xl px-3 py-3 sm:px-5 lg:px-6">
        <header className="mb-3 rounded-lg border border-gold/20 bg-bone p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Link
                aria-label="Kembali ke detail buku"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/40 bg-white text-ink transition hover:bg-cream"
                href={`/books/${book.id}`}
              >
                <ArrowLeft size={19} />
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-gold">
                  Baca Online
                </p>
                <h1 className="mt-1 line-clamp-2 text-xl font-bold leading-snug text-ink sm:text-2xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <a
                className={buttonClassName("secondary")}
                href={`/api/books/${book.id}/download`}
              >
                <Download size={17} />
                <span>Download</span>
              </a>

              {user ? (
                <form action={toggleFavorite}>
                  <input name="bookId" type="hidden" value={book.id} />
                  <input
                    name="active"
                    type="hidden"
                    value={isFavorite ? "true" : "false"}
                  />
                  <Button icon={<Heart size={17} />} type="submit" variant="secondary">
                    {isFavorite ? "Tersimpan" : "Favorit"}
                  </Button>
                </form>
              ) : null}

              {user && shelves.length > 0 ? (
                <form action={addBookToShelf} className="flex min-w-0 gap-2">
                  <input name="bookId" type="hidden" value={book.id} />
                  <select
                    aria-label="Pilih rak buku"
                    className="min-h-10 max-w-40 rounded-md border border-gold/30 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-pondok focus:ring-2 focus:ring-pondok/10 sm:max-w-52"
                    name="shelfId"
                    required
                  >
                    {shelves.map((shelf) => (
                      <option key={shelf.id} value={shelf.id}>
                        {shelf.name}
                      </option>
                    ))}
                  </select>
                  <Button icon={<Library size={17} />} type="submit" variant="secondary">
                    Rak
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </header>

        <BookReader bookId={book.id} title={title} />
      </section>
    </main>
  );
}
