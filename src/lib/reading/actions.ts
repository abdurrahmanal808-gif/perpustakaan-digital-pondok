"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { requireActiveUser } from "@/lib/auth/session";

export async function saveReadingProgress(formData: FormData) {
  const { user } = await requireActiveUser();
  const bookId = String(formData.get("bookId") || "");
  const lastPage = Number(formData.get("lastPage") || 1);
  const progress = Number(formData.get("progress") || 0);

  if (!bookId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("reading_history").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      last_page: Number.isFinite(lastPage) ? lastPage : 1,
      progress_percent: Number.isFinite(progress)
        ? Math.max(0, Math.min(100, progress))
        : 0,
      last_read_at: new Date().toISOString()
    },
    {
      onConflict: "user_id,book_id"
    }
  );

  revalidatePath("/dashboard/history");
}
