import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function getShelves(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getShelvesWithBooks(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shelves")
    .select(
      "*,shelf_books(id,book_id,books(id,title,author,status,cover_path,categories(id,name)))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
