"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { BOOK_COVERS_BUCKET } from "@/lib/constants";
import { requireActiveUser } from "@/lib/auth/session";
import { getBookForEdit, getBookFiles } from "@/lib/books/queries";
import {
  coverTarget,
  deleteStorageFiles,
  uploadFileToStorage
} from "@/lib/storage/files";
import {
  normalizeBookMetadata,
  validateBookMetadata,
  validateCoverFile
} from "@/lib/validations/book";
import type { BookStatus } from "@/lib/db/types";

export async function updateBook(formData: FormData) {
  const { user } = await requireActiveUser();
  const bookId = String(formData.get("bookId") || "");

  if (!bookId) {
    return;
  }

  const book = await getBookForEdit(bookId, user);

  if (!book) {
    redirect("/dashboard/books");
  }

  const input = {
    title: String(formData.get("title") || ""),
    author: String(formData.get("author") || ""),
    description: String(formData.get("description") || ""),
    categoryId: String(formData.get("categoryId") || ""),
    bookType: book.book_type,
    status: String(formData.get("status") || book.status),
    rightsConfirmed: true
  };

  const validationError = validateBookMetadata(input);
  if (validationError) {
    redirect(`/dashboard/books/${bookId}/edit?error=${encodeURIComponent(validationError)}`);
  }

  const metadata = normalizeBookMetadata(input);
  const allowedStatus: BookStatus = user.role === "admin" ? metadata.status : "pending";
  const cover = formData.get("cover");
  const removeCover = String(formData.get("removeCover") || "") === "on";
  let newCoverPath = book.cover_path;
  let newCoverStorageProvider = book.cover_storage_provider || "supabase";

  if (cover instanceof File && cover.size > 0) {
    const coverError = validateCoverFile(cover);

    if (coverError) {
      redirect(`/dashboard/books/${bookId}/edit?error=${encodeURIComponent(coverError)}`);
    }

    const target = coverTarget(book.user_id, book.id, cover.name);
    await uploadFileToStorage(cover, target);
    if (book.cover_path) {
      await deleteStorageFiles([
        {
          bucket: BOOK_COVERS_BUCKET,
          path: book.cover_path,
          provider: book.cover_storage_provider || "supabase"
        }
      ]);
    }
    newCoverPath = target.path;
    newCoverStorageProvider = target.provider;
  } else if (removeCover && book.cover_path) {
    await deleteStorageFiles([
      {
        bucket: BOOK_COVERS_BUCKET,
        path: book.cover_path,
        provider: book.cover_storage_provider || "supabase"
      }
    ]);
    newCoverPath = null;
    newCoverStorageProvider = "supabase";
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("books")
    .update({
      title: metadata.title,
      author: metadata.author || null,
      description: metadata.description || null,
      category_id: metadata.categoryId,
      cover_path: newCoverPath,
      cover_storage_provider: newCoverStorageProvider,
      status: allowedStatus,
      published_at:
        allowedStatus === "published" && !book.published_at
          ? new Date().toISOString()
          : book.published_at
    })
    .eq("id", bookId);

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/books");
  redirect(`/books/${bookId}`);
}

export async function deleteBook(bookId: string) {
  const { user } = await requireActiveUser();
  const book = await getBookForEdit(bookId, user);

  if (!book) {
    return { error: "Buku tidak ditemukan atau bukan milik Anda." };
  }

  const files = await getBookFiles(bookId);
  const storageFiles = files.map((file) => ({
    bucket: file.storage_bucket,
    path: file.storage_path,
    provider: file.storage_provider || "supabase"
  }));

  if (book.cover_path) {
    storageFiles.push({
      bucket: BOOK_COVERS_BUCKET,
      path: book.cover_path,
      provider: book.cover_storage_provider || "supabase"
    });
  }

  await deleteStorageFiles(storageFiles);

  const supabase = getSupabaseAdminClient();
  await supabase.from("books").update({ status: "deleted" }).eq("id", bookId);
  await supabase.from("book_files").delete().eq("book_id", bookId);
  await supabase.from("favorites").delete().eq("book_id", bookId);
  await supabase.from("shelf_books").delete().eq("book_id", bookId);

  revalidatePath("/dashboard/books");
  revalidatePath("/catalog");
  return { ok: true };
}
