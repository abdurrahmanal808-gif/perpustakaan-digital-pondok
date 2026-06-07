import Link from "next/link";
import {
  adminDeleteBook,
  adminHideBook,
  adminPublishBook
} from "@/lib/admin/actions";
import { adminGetBooks } from "@/lib/admin/queries";
import { getCoverUrlMap } from "@/lib/books/covers";
import type { BookWithRelations } from "@/lib/db/types";
import { formatDate, publicName } from "@/lib/format";
import { Button, buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const books = (await adminGetBooks()) as BookWithRelations[];
  const coverUrls = await getCoverUrlMap(books);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Manajemen Buku</h1>
      </div>

      <div className="grid gap-4">
        {books.map((book) => (
          <article
            className="grid gap-4 rounded-lg border border-gold/20 bg-bone p-4 shadow-sm md:grid-cols-[96px_1fr]"
            key={book.id}
          >
            {coverUrls.get(book.id) ? (
              <img
                alt={`Cover ${book.title}`}
                className="aspect-[3/4] w-24 rounded-md object-cover"
                src={coverUrls.get(book.id)}
              />
            ) : (
              <div className="flex aspect-[3/4] w-24 items-center justify-center rounded-md bg-cream p-2 text-center text-xs font-semibold text-clay">
                {book.title}
              </div>
            )}

            <div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="font-bold text-ink">{book.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {book.categories?.name || "-"} · {publicName(book.users)} ·{" "}
                    {formatDate(book.created_at)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-clay">
                    Status: {book.status}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    className={buttonClassName("secondary")}
                    href={`/books/${book.id}`}
                  >
                    Detail
                  </Link>
                  <Link
                    className={buttonClassName("secondary")}
                    href={`/dashboard/books/${book.id}/edit`}
                  >
                    Edit
                  </Link>
                  <form action={adminPublishBook}>
                    <input name="bookId" type="hidden" value={book.id} />
                    <Button type="submit" variant="secondary">
                      Terbitkan
                    </Button>
                  </form>
                  <form action={adminHideBook}>
                    <input name="bookId" type="hidden" value={book.id} />
                    <Button type="submit" variant="secondary">
                      Sembunyikan
                    </Button>
                  </form>
                  <form action={adminDeleteBook}>
                    <input name="bookId" type="hidden" value={book.id} />
                    <Button type="submit" variant="danger">
                      Hapus
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
