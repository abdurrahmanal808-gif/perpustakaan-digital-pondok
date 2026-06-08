import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getCurrentSession } from "@/lib/auth/session";
import type { BookFile, BookType } from "@/lib/db/types";
import {
  bookPageTarget,
  bookPdfTarget,
  coverTarget,
  deleteStorageFiles,
  uploadFileToStorage
} from "@/lib/storage/files";
import {
  normalizeBookMetadata,
  validateBookFiles,
  validateBookMetadata,
  validateCoverFile
} from "@/lib/validations/book";
import { BOOK_FILES_BUCKET } from "@/lib/constants";

function formFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentSession();

    if (!current) {
      return NextResponse.json({ error: "Anda harus login." }, { status: 401 });
    }

    if (current.user.is_blocked) {
      return NextResponse.json({ error: "Akun diblokir." }, { status: 403 });
    }

    const { user } = current;
    const formData = await request.formData();
    const cover = formData.get("cover");
    const files = formFiles(formData, "bookFiles");
    const metadataInput = {
      title: String(formData.get("title") || ""),
      author: String(formData.get("author") || ""),
      description: String(formData.get("description") || ""),
      categoryId: String(formData.get("categoryId") || ""),
      bookType: String(formData.get("bookType") || ""),
      status: "pending",
      rightsConfirmed: String(formData.get("rightsConfirmed") || "") === "on"
    };

    const metadataError = validateBookMetadata(metadataInput);
    if (metadataError) {
      return NextResponse.json({ error: metadataError }, { status: 400 });
    }

    const hasCover = cover instanceof File && cover.size > 0;

    if (hasCover) {
      const coverError = validateCoverFile(cover);
      if (coverError) {
        return NextResponse.json({ error: coverError }, { status: 400 });
      }
    }

    const metadata = normalizeBookMetadata(metadataInput);
    const bookType = metadata.bookType as BookType;
    const fileError = validateBookFiles(bookType, files);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", metadata.categoryId)
      .eq("is_active", true)
      .maybeSingle();

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
    }

    const bookId = randomUUID();
    const coverUploadTarget = hasCover ? coverTarget(user.id, bookId, cover.name) : null;
    const storageUploads: Array<{ bucket: string; path: string }> = [];

    const { error: bookError } = await supabase.from("books").insert({
      id: bookId,
      user_id: user.id,
      category_id: metadata.categoryId,
      title: metadata.title,
      author: metadata.author || null,
      description: metadata.description || null,
      book_type: bookType,
      status: "pending",
      cover_path: coverUploadTarget?.path || null,
      rights_confirmed: metadata.rightsConfirmed,
      published_at: null
    });

    if (bookError) {
      return NextResponse.json(
        { error: "Metadata buku gagal disimpan." },
        { status: 500 }
      );
    }

    try {
      if (hasCover && coverUploadTarget) {
        await uploadFileToStorage(cover, coverUploadTarget);
        storageUploads.push(coverUploadTarget);
      }

      const fileRows: Omit<BookFile, "created_at" | "updated_at">[] = [];

      for (const [index, file] of files.entries()) {
        const pageNumber = bookType === "scan" ? index + 1 : null;
        const target =
          bookType === "pdf"
            ? bookPdfTarget(user.id, bookId, file.name)
            : bookPageTarget(user.id, bookId, index + 1, file.name);

        await uploadFileToStorage(file, target);
        storageUploads.push(target);

        fileRows.push({
          id: randomUUID(),
          book_id: bookId,
          storage_bucket: BOOK_FILES_BUCKET,
          storage_path: target.path,
          original_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          file_kind: bookType === "pdf" ? "pdf" : "page",
          page_number: pageNumber
        });
      }

      const { error: fileErrorInsert } = await supabase
        .from("book_files")
        .insert(fileRows);

      if (fileErrorInsert) {
        throw new Error(fileErrorInsert.message);
      }
    } catch (error) {
      await deleteStorageFiles(storageUploads);
      await supabase.from("books").delete().eq("id", bookId);
      throw error;
    }

    return NextResponse.json({ book: { id: bookId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
