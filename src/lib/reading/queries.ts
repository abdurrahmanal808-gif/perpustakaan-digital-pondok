import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function getReadingHistory(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reading_history")
    .select(
      "*,books(id,title,author,book_type,status,cover_path,categories(id,name))"
    )
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function incrementBookView(bookId: string, userId?: string | null) {
  const supabase = getSupabaseAdminClient();
  await supabase.rpc("increment_book_view", {
    book_id_input: bookId,
    viewer_user_id_input: userId || null
  });
}

export async function incrementDownloadCount(bookId: string, userId?: string | null) {
  const supabase = getSupabaseAdminClient();
  await supabase.rpc("increment_book_download", {
    book_id_input: bookId,
    downloader_user_id_input: userId || null
  });
}
