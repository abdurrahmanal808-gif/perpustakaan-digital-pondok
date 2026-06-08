"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Flag, X } from "lucide-react";
import {
  BOOK_REPORT_REASON_LABELS,
  BOOK_REPORT_REASONS
} from "@/lib/constants";
import { reportBook } from "@/lib/reports/actions";
import { Button } from "@/components/ui/Button";

type ReportBookButtonProps = {
  bookId: string;
  title: string;
};

function SubmitReportButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} icon={<Flag size={17} />} type="submit">
      {pending ? "Mengirim..." : "Kirim laporan"}
    </Button>
  );
}

export function ReportBookButton({ bookId, title }: ReportBookButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        icon={<Flag size={17} />}
        onClick={() => setIsOpen(true)}
        variant="ghost"
      >
        Laporkan
      </Button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-lg bg-bone p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">Laporan Buku</p>
                <h2 className="mt-1 text-lg font-bold text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Laporan akan masuk ke admin untuk dicek. Gunakan fitur ini
                  kalau file rusak, metadata salah, atau ada masalah izin.
                </p>
              </div>
              <button
                aria-label="Tutup dialog"
                className="rounded-md p-2 text-slate-500 hover:bg-cream"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form action={reportBook} className="mt-5 space-y-4">
              <input name="bookId" type="hidden" value={bookId} />
              <label className="block text-sm font-semibold text-ink">
                Alasan laporan
                <select
                  className="mt-2 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                  name="reason"
                  required
                >
                  {BOOK_REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {BOOK_REPORT_REASON_LABELS[reason]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-ink">
                Catatan tambahan
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                  maxLength={1000}
                  name="description"
                  placeholder="Jelaskan singkat masalahnya agar admin mudah memeriksa."
                />
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button onClick={() => setIsOpen(false)} type="button" variant="secondary">
                  Batal
                </Button>
                <SubmitReportButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
