import Link from "next/link";
import {
  createShelf,
  deleteShelf,
  removeBookFromShelf,
  updateShelf
} from "@/lib/shelves/actions";
import { getShelvesWithBooks } from "@/lib/shelves/queries";
import { requireActiveUser } from "@/lib/auth/session";
import { Button, buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ShelvesPage() {
  const { user } = await requireActiveUser();
  const shelves = await getShelvesWithBooks(user.id);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Rak Buku</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Rak Pribadi</h1>
      </div>

      <form
        action={createShelf}
        className="grid gap-3 rounded-lg border border-gold/20 bg-bone p-4 md:grid-cols-[220px_1fr_auto]"
      >
        <input
          className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
          name="name"
          placeholder="Nama rak"
          required
        />
        <input
          className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
          name="description"
          placeholder="Deskripsi singkat"
        />
        <Button type="submit">Buat rak</Button>
      </form>

      {shelves.length > 0 ? (
        <div className="grid gap-4">
          {shelves.map((shelf) => (
            <article
              className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm"
              key={shelf.id}
            >
              <form action={updateShelf} className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto]">
                <input name="shelfId" type="hidden" value={shelf.id} />
                <input
                  className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                  defaultValue={shelf.name}
                  name="name"
                  required
                />
                <input
                  className="rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                  defaultValue={shelf.description || ""}
                  name="description"
                />
                <Button type="submit" variant="secondary">
                  Simpan
                </Button>
              </form>
              <form action={deleteShelf} className="mt-2">
                <input name="shelfId" type="hidden" value={shelf.id} />
                <Button type="submit" variant="danger">
                  Hapus rak
                </Button>
              </form>

              <div className="mt-4 grid gap-2">
                {(shelf.shelf_books || []).length > 0 ? (
                  shelf.shelf_books.map((item: { id: string; book_id: string; books?: { id: string; title: string } }) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white p-3 text-sm"
                      key={item.id}
                    >
                      <Link className="font-semibold text-ink" href={`/books/${item.book_id}`}>
                        {item.books?.title || "Buku"}
                      </Link>
                      <form action={removeBookFromShelf}>
                        <input name="shelfId" type="hidden" value={shelf.id} />
                        <input name="bookId" type="hidden" value={item.book_id} />
                        <button
                          className="text-sm font-semibold text-red-700"
                          type="submit"
                        >
                          Hapus dari rak
                        </button>
                      </form>
                    </div>
                  ))
                ) : (
                  <Link className={buttonClassName("secondary")} href="/catalog">
                    Tambah buku dari katalog
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gold/20 bg-bone p-6 text-sm text-slate-600">
          Belum ada rak buku.
        </div>
      )}
    </section>
  );
}
