import Link from "next/link";
import { AlertTriangle, CheckCircle2, EyeOff, Flag, ShieldBan } from "lucide-react";
import {
  adminBlockUser,
  adminDeleteBook,
  adminHideBook,
  adminPublishBook,
  adminUnblockUser,
  adminUpdateReportStatus
} from "@/lib/admin/actions";
import { adminGetReports } from "@/lib/admin/queries";
import {
  BOOK_REPORT_REASON_LABELS,
  BOOK_REPORT_STATUS_LABELS,
  BOOK_REPORT_STATUSES
} from "@/lib/constants";
import type { BookReportStatus } from "@/lib/db/types";
import { formatDateTime, publicName } from "@/lib/format";
import { Button, buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const statusTabs: Array<{ label: string; value: BookReportStatus | "all" }> = [
  { label: "Terbuka", value: "open" },
  { label: "Sedang dicek", value: "reviewing" },
  { label: "Selesai", value: "resolved" },
  { label: "Ditolak", value: "rejected" },
  { label: "Semua", value: "all" }
];

type AdminReportsPageProps = {
  searchParams: Promise<{
    status?: string;
    success?: string;
    error?: string;
  }>;
};

function normalizeStatus(value?: string): BookReportStatus | "all" {
  if (value === "all") {
    return "all";
  }

  if (BOOK_REPORT_STATUSES.includes(value as BookReportStatus)) {
    return value as BookReportStatus;
  }

  return "open";
}

function statusClassName(status: BookReportStatus) {
  if (status === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "reviewing") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-gold/30 bg-cream text-clay";
}

export default async function AdminReportsPage({
  searchParams
}: AdminReportsPageProps) {
  const query = await searchParams;
  const selectedStatus = normalizeStatus(query.status);
  const reports = await adminGetReports(selectedStatus);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">Moderasi Laporan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Periksa laporan buku dari user, ubah status review, lalu sembunyikan
            atau hapus buku jika memang perlu.
          </p>
        </div>
        <Link className={buttonClassName("secondary")} href="/admin/books">
          Kelola Buku
        </Link>
      </div>

      {query.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {query.success}
        </p>
      ) : null}

      {query.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {query.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Link
            className={buttonClassName(
              selectedStatus === tab.value ? "primary" : "secondary"
            )}
            href={`/admin/reports?status=${tab.value}`}
            key={tab.value}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <article
              className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm"
              key={report.id}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusClassName(
                        report.status
                      )}`}
                    >
                      {BOOK_REPORT_STATUS_LABELS[report.status]}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-gold/30 bg-white px-3 py-1 text-xs font-bold text-clay">
                      {BOOK_REPORT_REASON_LABELS[report.reason]}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-ink">
                    {report.books?.title || "Buku tidak tersedia"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Dilaporkan oleh @{report.reporter?.username || "user"} pada{" "}
                    {formatDateTime(report.created_at)}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md bg-white p-3 text-sm">
                      <p className="font-bold text-ink">Uploader buku</p>
                      <p className="mt-1 text-slate-600">
                        {publicName(report.books?.users)}
                      </p>
                    </div>
                    <div className="rounded-md bg-white p-3 text-sm">
                      <p className="font-bold text-ink">Status buku</p>
                      <p className="mt-1 text-slate-600">
                        {report.books?.status || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-slate-700">
                    <p className="font-bold text-ink">Catatan user</p>
                    <p className="mt-1 whitespace-pre-line">
                      {report.description || "Tidak ada catatan tambahan."}
                    </p>
                  </div>

                  {report.admin_note ? (
                    <div className="mt-3 rounded-md border border-gold/20 bg-cream p-4 text-sm leading-6 text-slate-700">
                      <p className="font-bold text-ink">Catatan admin</p>
                      <p className="mt-1 whitespace-pre-line">{report.admin_note}</p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {report.books ? (
                      <Link
                        className={buttonClassName("secondary")}
                        href={`/books/${report.books.id}`}
                      >
                        Buka Detail
                      </Link>
                    ) : null}
                    {report.books ? (
                      <>
                        <form action={adminHideBook}>
                          <input name="bookId" type="hidden" value={report.books.id} />
                          <Button icon={<EyeOff size={17} />} type="submit" variant="secondary">
                            Hide Buku
                          </Button>
                        </form>
                        <form action={adminPublishBook}>
                          <input name="bookId" type="hidden" value={report.books.id} />
                          <Button
                            icon={<CheckCircle2 size={17} />}
                            type="submit"
                            variant="secondary"
                          >
                            Publish
                          </Button>
                        </form>
                        <form action={adminDeleteBook}>
                          <input name="bookId" type="hidden" value={report.books.id} />
                          <Button
                            icon={<AlertTriangle size={17} />}
                            type="submit"
                            variant="danger"
                          >
                            Hapus Buku
                          </Button>
                        </form>
                      </>
                    ) : null}
                    {report.reporter ? (
                      report.reporter.is_blocked ? (
                        <form action={adminUnblockUser}>
                          <input name="userId" type="hidden" value={report.reporter.id} />
                          <Button type="submit" variant="secondary">
                            Aktifkan Pelapor
                          </Button>
                        </form>
                      ) : (
                        <form action={adminBlockUser} className="flex flex-wrap gap-2">
                          <input name="userId" type="hidden" value={report.reporter.id} />
                          <input
                            className="min-h-10 rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                            name="reason"
                            placeholder="Alasan blokir"
                          />
                          <Button
                            icon={<ShieldBan size={17} />}
                            type="submit"
                            variant="danger"
                          >
                            Blokir Pelapor
                          </Button>
                        </form>
                      )
                    ) : null}
                  </div>
                </div>

                <form
                  action={adminUpdateReportStatus}
                  className="rounded-lg border border-gold/20 bg-white p-4"
                >
                  <input name="reportId" type="hidden" value={report.id} />
                  <input name="returnStatus" type="hidden" value={selectedStatus} />
                  <label className="block text-sm font-bold text-ink">
                    Status laporan
                    <select
                      className="mt-2 w-full rounded-md border border-gold/30 bg-bone px-3 py-2 text-sm"
                      defaultValue={report.status}
                      name="status"
                    >
                      {BOOK_REPORT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {BOOK_REPORT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-4 block text-sm font-bold text-ink">
                    Catatan admin
                    <textarea
                      className="mt-2 min-h-32 w-full resize-y rounded-md border border-gold/30 bg-bone px-3 py-2 text-sm"
                      defaultValue={report.admin_note || ""}
                      maxLength={800}
                      name="adminNote"
                      placeholder="Contoh: File sudah dicek dan buku disembunyikan."
                    />
                  </label>
                  <Button className="mt-4 w-full" icon={<Flag size={17} />} type="submit">
                    Simpan Review
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gold/40 bg-bone p-8 text-center shadow-sm">
          <Flag className="mx-auto text-gold" size={34} />
          <h2 className="mt-3 text-xl font-bold text-ink">Belum ada laporan</h2>
          <p className="mt-2 text-sm text-slate-600">
            Kalau user melaporkan buku, laporan akan tampil di sini.
          </p>
        </div>
      )}
    </section>
  );
}
