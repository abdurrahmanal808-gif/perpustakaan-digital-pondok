"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { requireActiveUser } from "@/lib/auth/session";

function cleanShelfName(value: FormDataEntryValue | null) {
  return String(value || "").trim().slice(0, 80);
}

export async function createShelf(formData: FormData) {
  const { user } = await requireActiveUser();
  const name = cleanShelfName(formData.get("name"));
  const description = String(formData.get("description") || "").trim().slice(0, 300);

  if (!name) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("shelves").insert({
    user_id: user.id,
    name,
    description: description || null
  });

  revalidatePath("/dashboard/shelves");
}

export async function updateShelf(formData: FormData) {
  const { user } = await requireActiveUser();
  const shelfId = String(formData.get("shelfId") || "");
  const name = cleanShelfName(formData.get("name"));
  const description = String(formData.get("description") || "").trim().slice(0, 300);

  if (!shelfId || !name) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("shelves")
    .update({ name, description: description || null })
    .eq("id", shelfId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/shelves");
}

export async function deleteShelf(formData: FormData) {
  const { user } = await requireActiveUser();
  const shelfId = String(formData.get("shelfId") || "");

  if (!shelfId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("shelves").delete().eq("id", shelfId).eq("user_id", user.id);

  revalidatePath("/dashboard/shelves");
}

export async function addBookToShelf(formData: FormData) {
  const { user } = await requireActiveUser();
  const shelfId = String(formData.get("shelfId") || "");
  const bookId = String(formData.get("bookId") || "");

  if (!shelfId || !bookId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data: shelf } = await supabase
    .from("shelves")
    .select("id")
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelf) {
    return;
  }

  await supabase.from("shelf_books").upsert(
    {
      shelf_id: shelfId,
      book_id: bookId
    },
    {
      onConflict: "shelf_id,book_id"
    }
  );

  revalidatePath("/dashboard/shelves");
}

export async function removeBookFromShelf(formData: FormData) {
  const { user } = await requireActiveUser();
  const shelfId = String(formData.get("shelfId") || "");
  const bookId = String(formData.get("bookId") || "");

  if (!shelfId || !bookId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data: shelf } = await supabase
    .from("shelves")
    .select("id")
    .eq("id", shelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shelf) {
    return;
  }

  await supabase
    .from("shelf_books")
    .delete()
    .eq("shelf_id", shelfId)
    .eq("book_id", bookId);

  revalidatePath("/dashboard/shelves");
}
