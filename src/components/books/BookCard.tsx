import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  Heart,
  Pencil,
  Tag,
  UserRound
} from "lucide-react";
import type { BookWithRelations } from "@/lib/db/types";
import { formatBytes, formatDate, publicName } from "@/lib/format";
import { buttonClassName, Button } from "@/components/ui/Button";
import { DeleteBookButton } from "@/components/books/DeleteBookButton";
import { toggleFavorite } from "@/lib/favorites/actions";

type BookCardProps = {
  book: BookWithRelations;
  coverUrl?: string;
  favoriteActive?: boolean;
  showManage?: boolean;
};

function totalFileSize(book: BookWithRelations) {
  return (book.book_files || []).reduce((sum, file) => sum + file.file_size, 0);
}

function formatBookType(value: string) {
  return value === "pdf" ? "PDF" : "Scan";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    published: "Terbit",
    hidden: "Disembunyikan",
    deleted: "Dihapus"
  };

  return labels[status] || status;
}

export function BookCard({
  book,
  coverUrl,
  favoriteActive,
  showManage = false
}: BookCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-gold/20 bg-bone shadow-sm transition hover:border-gold/40 hover:shadow-md">
      <div className="grid gap-0 sm:grid-cols-[190px_1fr]">
        <Link
          className="block aspect-[3/4] bg-cream"
          href={`/books/${book.id}`}
        >
          {coverUrl ? (
            <img
              alt={`Cover ${book.title}`}
              className="h-full w-full object-cover"
              src={coverUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-clay">
              {book.title}
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-col p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/books/${book.id}`}>
                <h2 className="line-clamp-2 text-lg font-bold text-ink hover:text-pondok">
                  {book.title}
                </h2>
              </Link>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p className="flex items-center gap-2">
                  <UserRound size={16} />
                  <span>{book.author || "Tanpa penulis"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Tag size={16} />
                  <span>{book.categories?.name || "Tanpa kategori"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(book.created_at)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <UserRound size={16} />
                  <span>{publicName(book.users)}</span>
                </p>
              </div>
            </div>

            {showManage ? (
              <span className="w-fit rounded-md bg-cream px-2 py-1 text-xs font-semibold text-clay">
                {statusLabel(book.status)}
              </span>
            ) : null}
          </div>

          {book.description ? (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
              {book.description}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2">
              <Eye className="text-gold" size={16} />
              Dilihat: {book.view_count}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2">
              <Download className="text-gold" size={16} />
              Download: {book.download_count}
            </span>
            <span className="rounded-md bg-white px-3 py-2">
              Ukuran: {formatBytes(totalFileSize(book))}
            </span>
            <span className="rounded-md bg-white px-3 py-2">
              Format: {formatBookType(book.book_type)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-gold/10 pt-4">
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

            {favoriteActive !== undefined ? (
              <form action={toggleFavorite}>
                <input name="bookId" type="hidden" value={book.id} />
                <input
                  name="active"
                  type="hidden"
                  value={favoriteActive ? "true" : "false"}
                />
                <Button icon={<Heart size={17} />} type="submit" variant="secondary">
                  {favoriteActive ? "Tersimpan" : "Simpan"}
                </Button>
              </form>
            ) : (
              <Link className={buttonClassName("secondary")} href="/login">
                <Heart size={17} />
                <span>Simpan</span>
              </Link>
            )}

            {showManage ? (
              <>
                <Link
                  className={buttonClassName("secondary")}
                  href={`/dashboard/books/${book.id}/edit`}
                >
                  <Pencil size={17} />
                  <span>Edit</span>
                </Link>
                <DeleteBookButton bookId={book.id} title={book.title} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
