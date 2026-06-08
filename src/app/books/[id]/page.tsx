import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Download, Heart, Library } from "lucide-react";
import { requireActiveUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { getCoverUrl } from "@/lib/books/covers";
import { getFavoriteIds } from "@/lib/favorites/queries";
import { toggleFavorite } from "@/lib/favorites/actions";
import { getShelves } from "@/lib/shelves/queries";
import { addBookToShelf } from "@/lib/shelves/actions";
import { formatDate, publicName } from "@/lib/format";
import { buttonClassName, Button } from "@/components/ui/Button";
import { DefaultBookCover } from "@/components/books/DefaultBookCover";
import { ReportBookButton } from "@/components/books/ReportBookButton";

export const dynamic = "force-dynamic";

type BookDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    reported?: string;
    report_error?: string;
  }>;
};

export default async function BookDetailPage({
  params,
  searchParams
}: BookDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { user } = await requireActiveUser(`/books/${id}`);
  const book = await getBookDetail(id, user);

  if (!book) {
    notFound();
  }

  const [coverUrl, favoriteIds, shelves] = await Promise.all([
    getCoverUrl(book),
    getFavoriteIds(user.id),
    getShelves(user.id)
  ]);
  const favoriteActive = favoriteIds.has(book.id);

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <div>
          {coverUrl ? (
            <img
              alt={`Cover ${book.title}`}
              className="aspect-[3/4] w-full rounded-lg border border-gold/20 object-cover shadow-sm"
              src={coverUrl}
            />
          ) : (
            <div className="aspect-[3/4] overflow-hidden rounded-lg border border-gold/20 shadow-sm">
              <DefaultBookCover title={book.title} />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
          <p className="text-sm font-semibold text-gold">
            {book.categories?.name || "Tanpa kategori"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{book.title}</h1>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p>Penulis: {book.author || "Tanpa penulis"}</p>
            <p>Uploader: {publicName(book.users)}</p>
            <p>Tanggal upload: {formatDate(book.created_at)}</p>
            <p>Jenis: {book.book_type.toUpperCase()}</p>
            <p>Dilihat: {book.view_count}</p>
            <p>Download: {book.download_count}</p>
          </div>

          {query.reported === "1" ? (
            <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              Laporan berhasil dikirim. Admin akan memeriksa buku ini.
            </p>
          ) : null}

          {query.report_error ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {query.report_error}
            </p>
          ) : null}

          {book.description ? (
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
              {book.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link className={buttonClassName()} href={`/books/${book.id}/read`}>
              <BookOpen size={17} />
              <span>Baca online</span>
            </Link>
            <a
              className={buttonClassName("secondary")}
              href={`/api/books/${book.id}/download`}
            >
              <Download size={17} />
              <span>Download</span>
            </a>
            <form action={toggleFavorite}>
              <input name="bookId" type="hidden" value={book.id} />
              <input
                name="active"
                type="hidden"
                value={favoriteActive ? "true" : "false"}
              />
              <Button icon={<Heart size={17} />} type="submit" variant="secondary">
                {favoriteActive ? "Tersimpan" : "Favorit"}
              </Button>
            </form>
            {book.user_id !== user.id ? (
              <ReportBookButton bookId={book.id} title={book.title} />
            ) : null}
          </div>

          {shelves.length > 0 ? (
            <form action={addBookToShelf} className="mt-5 flex flex-wrap gap-2">
              <input name="bookId" type="hidden" value={book.id} />
              <select
                className="min-h-10 rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
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
                Tambah ke rak
              </Button>
            </form>
          ) : null}

          {book.book_type === "scan" && (book.book_files || []).length > 0 ? (
            <div className="mt-6 rounded-md bg-white p-4">
              <h2 className="text-sm font-bold text-ink">Download halaman scan</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(book.book_files || []).map((file, index) => (
                  <a
                    className="rounded-md border border-gold/30 px-3 py-2 text-sm font-semibold text-pondok hover:bg-cream"
                    href={`/api/books/${book.id}/files/${file.id}?download=1`}
                    key={file.id}
                  >
                    Halaman {file.page_number || index + 1}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
