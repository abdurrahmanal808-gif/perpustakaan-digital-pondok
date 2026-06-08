"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { BOOK_REPORT_STATUSES } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { requireAdmin } from "@/lib/auth/session";
import { deleteBook } from "@/lib/books/actions";
import { slugify } from "@/lib/security/filename";
import type { BookReportStatus, UserRole } from "@/lib/db/types";

export async function adminUpdateUserRole(formData: FormData) {
  const { user } = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as UserRole;

  if (!userId || !["user", "admin"].includes(role)) {
    return;
  }

  if (userId === user.id && role !== "admin") {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("users").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function adminBlockUser(formData: FormData) {
  const { user } = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const reason = String(formData.get("reason") || "").trim().slice(0, 300);

  if (!userId) {
    return;
  }

  if (userId === user.id) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("users")
    .update({
      is_blocked: true,
      blocked_reason: reason || "Diblokir oleh admin."
    })
    .eq("id", userId);
  await supabase
    .from("sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);

  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
}

export async function adminUnblockUser(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");

  if (!userId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("users")
    .update({
      is_blocked: false,
      blocked_reason: null
    })
    .eq("id", userId);

  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
}

export async function adminCreateCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const description = String(formData.get("description") || "").trim().slice(0, 300);
  const slug = slugify(name);

  if (!name || !slug) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: description || null
  });

  if (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        error.code === "23505"
          ? "Nama atau slug kategori sudah dipakai."
          : "Kategori gagal dibuat."
      )}`
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidateTag("categories");
  revalidateTag("public-books");
  redirect(
    `/admin/categories?success=${encodeURIComponent("Kategori berhasil ditambahkan.")}`
  );
}

export async function adminUpdateCategory(formData: FormData) {
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") || "");
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const description = String(formData.get("description") || "").trim().slice(0, 300);
  const isActive = String(formData.get("isActive") || "") === "on";
  const slug = slugify(name);

  if (!categoryId || !name || !slug) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description: description || null,
      is_active: isActive
    })
    .eq("id", categoryId);

  if (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        error.code === "23505"
          ? "Nama atau slug kategori sudah dipakai."
          : "Kategori gagal diperbarui."
      )}`
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidateTag("categories");
  revalidateTag("public-books");
  redirect(
    `/admin/categories?success=${encodeURIComponent("Kategori berhasil diperbarui.")}`
  );
}

export async function adminDeleteCategory(formData: FormData) {
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") || "");

  if (!categoryId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { count } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if ((count || 0) > 0) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        "Kategori ini masih digunakan oleh beberapa buku."
      )}`
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("Kategori gagal dihapus.")}`
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidateTag("categories");
  redirect(
    `/admin/categories?success=${encodeURIComponent("Kategori berhasil dihapus.")}`
  );
}

export async function adminHideBook(formData: FormData) {
  await requireAdmin();
  const bookId = String(formData.get("bookId") || "");

  if (!bookId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("books").update({ status: "hidden" }).eq("id", bookId);

  revalidatePath("/admin/books");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/catalog");
  revalidateTag("public-books");
}

export async function adminPublishBook(formData: FormData) {
  await requireAdmin();
  const bookId = String(formData.get("bookId") || "");

  if (!bookId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("books")
    .update({
      status: "published",
      published_at: new Date().toISOString()
    })
    .eq("id", bookId);

  revalidatePath("/admin/books");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/catalog");
  revalidateTag("public-books");
}

export async function adminDeleteBook(formData: FormData) {
  await requireAdmin();
  const bookId = String(formData.get("bookId") || "");

  if (!bookId) {
    return;
  }

  await deleteBook(bookId);
  revalidatePath("/admin/books");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath("/catalog");
  revalidateTag("public-books");
}

export async function adminUpdateReportStatus(formData: FormData) {
  const { user } = await requireAdmin();
  const reportId = String(formData.get("reportId") || "");
  const status = String(formData.get("status") || "") as BookReportStatus;
  const returnStatus = String(formData.get("returnStatus") || "open");
  const adminNote = String(formData.get("adminNote") || "").trim().slice(0, 800);

  if (!reportId || !BOOK_REPORT_STATUSES.includes(status)) {
    return;
  }

  const isClosed = status === "resolved" || status === "rejected";
  const supabase = getSupabaseAdminClient();
  const { data: report } = await supabase
    .from("book_reports")
    .select("book_id")
    .eq("id", reportId)
    .single();

  const { error } = await supabase
    .from("book_reports")
    .update({
      status,
      admin_note: adminNote || null,
      resolved_by: isClosed ? user.id : null,
      resolved_at: isClosed ? new Date().toISOString() : null
    })
    .eq("id", reportId);

  if (error) {
    redirect(
      `/admin/reports?status=${encodeURIComponent(
        returnStatus
      )}&error=${encodeURIComponent("Status laporan gagal diperbarui.")}`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  if (report?.book_id) {
    revalidatePath(`/books/${report.book_id}`);
  }

  redirect(
    `/admin/reports?status=${encodeURIComponent(
      returnStatus
    )}&success=${encodeURIComponent("Status laporan diperbarui.")}`
  );
}
