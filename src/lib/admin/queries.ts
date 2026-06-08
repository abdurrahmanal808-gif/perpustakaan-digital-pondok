import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import type {
  BookReportReason,
  BookReportStatus,
  BookReportWithRelations
} from "@/lib/db/types";

type AdminLatestReport = {
  id: string;
  reason: BookReportReason;
  status: BookReportStatus;
  created_at: string;
  books: { id: string; title: string } | null;
};

export async function adminGetStats() {
  const supabase = getSupabaseAdminClient();
  const [
    users,
    books,
    categories,
    downloads,
    reportsOpen,
    latestBooks,
    latestUsers,
    latestReports
  ] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .neq("status", "deleted"),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("downloads").select("id", { count: "exact", head: true }),
      supabase
        .from("book_reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "reviewing"]),
      supabase
        .from("books")
        .select("id,title,created_at,status")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("users")
        .select("id,username,full_name,created_at,role,is_blocked")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("book_reports")
        .select("id,reason,status,created_at,books!book_reports_book_id_fkey(id,title)")
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

  const normalizedLatestReports: AdminLatestReport[] = (latestReports.data || []).map((report) => {
    const books = Array.isArray(report.books) ? report.books[0] : report.books;

    return {
      id: report.id,
      reason: report.reason as BookReportReason,
      status: report.status as BookReportStatus,
      created_at: report.created_at,
      books: books || null
    };
  });

  return {
    totalUsers: users.count || 0,
    totalBooks: books.count || 0,
    totalCategories: categories.count || 0,
    totalDownloads: downloads.count || 0,
    openReports: reportsOpen.count || 0,
    latestBooks: latestBooks.data || [],
    latestUsers: latestUsers.data || [],
    latestReports: normalizedLatestReports
  };
}

export async function adminGetUsers() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,username,full_name,role,is_blocked,blocked_reason,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function adminGetBooks() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .select("*,categories(id,name),users(id,username,full_name),book_files(*)")
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function adminGetReports(status?: BookReportStatus | "all") {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("book_reports")
    .select(
      `
      id,
      book_id,
      reporter_user_id,
      reason,
      description,
      status,
      admin_note,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      books!book_reports_book_id_fkey(
        id,
        title,
        status,
        user_id,
        users(id,username,full_name)
      ),
      reporter:users!book_reports_reporter_user_id_fkey(
        id,
        username,
        full_name,
        is_blocked,
        blocked_reason
      ),
      resolver:users!book_reports_resolved_by_fkey(
        id,
        username,
        full_name
      )
      `
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01" || error.message.includes("book_reports")) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data || []).map((report) => {
    const book = Array.isArray(report.books) ? report.books[0] : report.books;
    const bookUser =
      book && Array.isArray(book.users) ? book.users[0] : book?.users || null;
    const reporter = Array.isArray(report.reporter)
      ? report.reporter[0]
      : report.reporter;
    const resolver = Array.isArray(report.resolver)
      ? report.resolver[0]
      : report.resolver;

    return {
      id: report.id,
      book_id: report.book_id,
      reporter_user_id: report.reporter_user_id,
      reason: report.reason as BookReportReason,
      description: report.description,
      status: report.status as BookReportStatus,
      admin_note: report.admin_note,
      resolved_by: report.resolved_by,
      resolved_at: report.resolved_at,
      created_at: report.created_at,
      updated_at: report.updated_at,
      books: book
        ? {
            id: book.id,
            title: book.title,
            status: book.status,
            user_id: book.user_id,
            users: bookUser || null
          }
        : null,
      reporter: reporter || null,
      resolver: resolver || null
    };
  }) as BookReportWithRelations[];
}
