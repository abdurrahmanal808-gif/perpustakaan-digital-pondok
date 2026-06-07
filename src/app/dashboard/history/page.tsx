import Link from "next/link";
import { requireActiveUser } from "@/lib/auth/session";
import { getReadingHistory } from "@/lib/reading/queries";
import { formatDateTime } from "@/lib/format";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ReadingHistoryPage() {
  const { user } = await requireActiveUser();
  const history = await getReadingHistory(user.id);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Aktivitas</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Riwayat Baca</h1>
      </div>

      {history.length > 0 ? (
        <div className="grid gap-3">
          {history.map((item) => (
            <article
              className="rounded-lg border border-gold/20 bg-bone p-4 shadow-sm"
              key={item.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-ink">
                    {item.books?.title || "Buku"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Halaman terakhir {item.last_page || 1} · {item.progress_percent}% ·{" "}
                    {formatDateTime(item.last_read_at)}
                  </p>
                </div>
                <Link
                  className={buttonClassName("secondary")}
                  href={`/books/${item.book_id}/read`}
                >
                  Lanjut baca
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gold/20 bg-bone p-6 text-sm text-slate-600">
          Belum ada riwayat baca.
        </div>
      )}
    </section>
  );
}
