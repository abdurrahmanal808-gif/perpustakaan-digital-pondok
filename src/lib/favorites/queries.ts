import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { requireActiveUser } from "@/lib/auth/session";

export async function getFavoriteIds(userId?: string | null) {
  if (!userId) {
    return new Set<string>();
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("favorites")
    .select("book_id")
    .eq("user_id", userId);

  return new Set((data || []).map((favorite) => favorite.book_id as string));
}

export async function getFavoritesPage() {
  const { user } = await requireActiveUser();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(
      "id,created_at,books(*,categories(id,name,slug),users(id,username,full_name),book_files(*))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
