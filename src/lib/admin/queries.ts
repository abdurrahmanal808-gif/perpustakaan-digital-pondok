import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function adminGetStats() {
  const supabase = getSupabaseAdminClient();
  const [users, books, categories, downloads, latestBooks, latestUsers] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .neq("status", "deleted"),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("downloads").select("id", { count: "exact", head: true }),
      supabase
        .from("books")
        .select("id,title,created_at,status")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("users")
        .select("id,username,full_name,created_at,role,is_blocked")
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

  return {
    totalUsers: users.count || 0,
    totalBooks: books.count || 0,
    totalCategories: categories.count || 0,
    totalDownloads: downloads.count || 0,
    latestBooks: latestBooks.data || [],
    latestUsers: latestUsers.data || []
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
