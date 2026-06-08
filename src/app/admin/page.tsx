import Link from "next/link";
import { BookOpen, Download, Flag, FolderTree, Users } from "lucide-react";
import { adminGetStats } from "@/lib/admin/queries";
import {
  BOOK_REPORT_REASON_LABELS,
  BOOK_REPORT_STATUS_LABELS
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function AdminStat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-gold/20 bg-bone p-4 shadow-sm">
      <Icon className="text-gold" size={22} />
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await adminGetStats();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Dashboard Admin</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStat icon={Users} label="Total user" value={stats.totalUsers} />
        <AdminStat icon={BookOpen} label="Total buku" value={stats.totalBooks} />
        <AdminStat icon={FolderTree} label="Kategori" value={stats.totalCategories} />
        <AdminStat icon={Download} label="Download" value={stats.totalDownloads} />
        <AdminStat icon={Flag} label="Laporan terbuka" value={stats.openReports} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Buku terbaru</h2>
            <Link className={buttonClassName("secondary")} href="/admin/books">
              Kelola
            </Link>
          </div>
          <div className="space-y-3">
            {stats.latestBooks.map((book) => (
              <div className="rounded-md bg-white p-3 text-sm" key={book.id}>
                <p className="font-semibold text-ink">{book.title}</p>
                <p className="text-slate-600">
                  {book.status} - {formatDate(book.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Laporan terbaru</h2>
            <Link className={buttonClassName("secondary")} href="/admin/reports">
              Moderasi
            </Link>
          </div>
          <div className="space-y-3">
            {stats.latestReports.length > 0 ? (
              stats.latestReports.map((report) => (
                <div className="rounded-md bg-white p-3 text-sm" key={report.id}>
                  <p className="font-semibold text-ink">
                    {report.books?.title || "Buku tidak tersedia"}
                  </p>
                  <p className="text-slate-600">
                    {BOOK_REPORT_REASON_LABELS[report.reason]} -{" "}
                    {BOOK_REPORT_STATUS_LABELS[report.status]}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-white p-3 text-sm text-slate-600">
                Belum ada laporan buku.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">User terbaru</h2>
            <Link className={buttonClassName("secondary")} href="/admin/users">
              Kelola
            </Link>
          </div>
          <div className="space-y-3">
            {stats.latestUsers.map((user) => (
              <div className="rounded-md bg-white p-3 text-sm" key={user.id}>
                <p className="font-semibold text-ink">@{user.username}</p>
                <p className="text-slate-600">
                  {user.role} - {user.is_blocked ? "diblokir" : "aktif"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
