import Link from "next/link";
import { BookMarked, Clock, Heart, Library, Upload } from "lucide-react";
import { requireActiveUser } from "@/lib/auth/session";
import { getCoverUrlMap } from "@/lib/books/covers";
import { getMyBooks, getUserDashboardStats } from "@/lib/books/queries";
import { BookCard } from "@/components/books/BookCard";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function StatBox({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: typeof BookMarked;
}) {
  return (
    <div className="rounded-lg border border-gold/20 bg-bone p-4 shadow-sm">
      <Icon className="text-gold" size={22} />
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { user } = await requireActiveUser();
  const [stats, books] = await Promise.all([
    getUserDashboardStats(user.id),
    getMyBooks(user.id)
  ]);
  const latestBooks = books.slice(0, 3);
  const coverUrls = await getCoverUrlMap(latestBooks);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
        <p className="text-sm font-semibold text-gold">{"Assalamu'alaikum"}</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">
          Selamat datang, {user.full_name || user.username}
        </h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className={buttonClassName()} href="/dashboard/books/upload">
            <Upload size={18} />
            <span>Upload buku</span>
          </Link>
          <Link className={buttonClassName("secondary")} href="/catalog">
            <Library size={18} />
            <span>Buka katalog</span>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox icon={BookMarked} label="Buku upload" value={stats.totalBooks} />
        <StatBox icon={Heart} label="Favorit" value={stats.totalFavorites} />
        <StatBox icon={Library} label="Rak buku" value={stats.totalShelves} />
        <StatBox icon={Clock} label="Riwayat baca" value={stats.totalHistory} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Buku saya terbaru</h2>
          <Link className="text-sm font-semibold text-pondok" href="/dashboard/books">
            Lihat semua
          </Link>
        </div>
        {latestBooks.length > 0 ? (
          <div className="grid gap-4">
            {latestBooks.map((book) => (
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
            Anda belum mengupload buku.
          </div>
        )}
      </section>
    </div>
  );
}
