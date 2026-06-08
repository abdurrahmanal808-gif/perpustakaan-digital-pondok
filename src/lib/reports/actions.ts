"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BOOK_REPORT_REASONS } from "@/lib/constants";
import { requireActiveUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { BookReportReason } from "@/lib/db/types";

function bookReportRedirect(bookId: string, params: Record<string, string>): never {
  const query = new URLSearchParams(params);
  redirect(`/books/${bookId}?${query.toString()}`);
}

export async function reportBook(formData: FormData) {
  const bookId = String(formData.get("bookId") || "");
  const reason = String(formData.get("reason") || "") as BookReportReason;
  const description = String(formData.get("description") || "").trim().slice(0, 1000);

  if (!bookId) {
    redirect("/catalog");
  }

  const { user } = await requireActiveUser(`/books/${bookId}`);

  if (!BOOK_REPORT_REASONS.includes(reason)) {
    bookReportRedirect(bookId, {
      report_error: "Pilih alasan laporan yang sesuai."
    });
  }

  const book = await getBookDetail(bookId, user);

  if (!book) {
    bookReportRedirect(bookId, {
      report_error: "Buku tidak ditemukan atau tidak bisa diakses."
    });
  }

  if (book.user_id === user.id) {
    bookReportRedirect(bookId, {
      report_error: "Buku milik sendiri tidak perlu dilaporkan."
    });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("book_reports").insert({
    book_id: bookId,
    reporter_user_id: user.id,
    reason,
    description: description || null
  });

  if (error) {
    bookReportRedirect(bookId, {
      report_error:
        error.code === "23505"
          ? "Laporan kamu sebelumnya masih menunggu review admin."
          : "Laporan gagal dikirim. Pastikan SQL moderasi sudah dijalankan di Supabase."
    });
  }

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  bookReportRedirect(bookId, {
    reported: "1"
  });
}
