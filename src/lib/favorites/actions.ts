"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { requireActiveUser } from "@/lib/auth/session";

export async function addFavorite(bookId: string) {
  const { user } = await requireActiveUser();
  const supabase = getSupabaseAdminClient();

  await supabase.from("favorites").upsert(
    {
      user_id: user.id,
      book_id: bookId
    },
    {
      onConflict: "user_id,book_id"
    }
  );

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/favorites");
}

export async function removeFavorite(bookId: string) {
  const { user } = await requireActiveUser();
  const supabase = getSupabaseAdminClient();

  await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/favorites");
}

export async function toggleFavorite(formData: FormData) {
  const bookId = String(formData.get("bookId") || "");
  const active = String(formData.get("active") || "") === "true";

  if (!bookId) {
    return;
  }

  if (active) {
    await removeFavorite(bookId);
  } else {
    await addFavorite(bookId);
  }
}
