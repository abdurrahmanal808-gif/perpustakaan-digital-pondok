import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { BookFile, BookType, StorageProvider } from "@/lib/db/types";
import { deleteStorageFiles } from "@/lib/storage/files";
import {
  normalizeBookMetadata,
  validateBookMetadata
} from "@/lib/validations/book";

type UploadedFilePayload = {
  bucket: string;
  path: string;
  provider: StorageProvider;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileKind: "pdf" | "page";
  pageNumber: number | null;
};

type UploadedCoverPayload = {
  bucket: string;
  path: string;
  provider: StorageProvider;
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isSafeUserBookPath(path: string, userId: string, bookId: string) {
  return path.startsWith(`users/${userId}/books/${bookId}/`);
}

export async function POST(request: Request) {
  const storageUploads: Array<{
    bucket: string;
    path: string;
    provider?: StorageProvider;
  }> = [];

  try {
    const current = await getCurrentSession();

    if (!current) {
      return NextResponse.json({ error: "Anda harus login." }, { status: 401 });
    }

    if (current.user.is_blocked) {
      return NextResponse.json({ error: "Akun diblokir." }, { status: 403 });
    }

    const body = await request.json();

    const bookId = String(body.bookId || "");

    if (!isValidUuid(bookId)) {
      return NextResponse.json({ error: "ID buku tidak valid." }, { status: 400 });
    }

    const metadataInput = {
      title: String(body.title || ""),
      author: String(body.author || ""),
      description: String(body.description || ""),
      categoryId: String(body.categoryId || ""),
      bookType: String(body.bookType || ""),
      status: "pending",
      rightsConfirmed: Boolean(body.rightsConfirmed)
    };

    const metadataError = validateBookMetadata(metadataInput);

    if (metadataError) {
      return NextResponse.json({ error: metadataError }, { status: 400 });
    }

    const metadata = normalizeBookMetadata(metadataInput);
    const bookType = metadata.bookType as BookType;
    const files = Array.isArray(body.files)
      ? (body.files as UploadedFilePayload[])
      : [];
    const cover = body.cover ? (body.cover as UploadedCoverPayload) : null;

    if (files.length === 0) {
      return NextResponse.json({ error: "File buku wajib diupload." }, { status: 400 });
    }

    if (bookType === "pdf" && files.length !== 1) {
      return NextResponse.json(
        { error: "Buku PDF hanya boleh memiliki satu file." },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!file.bucket || !file.path || !file.provider) {
        return NextResponse.json({ error: "Data file tidak lengkap." }, { status: 400 });
      }

      if (!isSafeUserBookPath(file.path, current.user.id, bookId)) {
        return NextResponse.json({ error: "Path file tidak valid." }, { status: 400 });
      }

      storageUploads.push({
        bucket: file.bucket,
        path: file.path,
        provider: file.provider
      });
    }

    if (cover) {
      if (!cover.bucket || !cover.path || !cover.provider) {
        return NextResponse.json({ error: "Data cover tidak lengkap." }, { status: 400 });
      }

      if (!isSafeUserBookPath(cover.path, current.user.id, bookId)) {
        return NextResponse.json({ error: "Path cover tidak valid." }, { status: 400 });
      }

      storageUploads.push({
        bucket: cover.bucket,
        path: cover.path,
        provider: cover.provider
      });
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

    const { error: bookError } = await supabase.from("books").insert({
      id: bookId,
      user_id: current.user.id,
      category_id: metadata.categoryId,
      title: metadata.title,
      author: metadata.author || null,
      description: metadata.description || null,
      book_type: bookType,
      status: "pending",
      cover_path: cover?.path || null,
      cover_storage_provider: cover?.provider || "supabase",
      rights_confirmed: metadata.rightsConfirmed,
      published_at: null
    });

    if (bookError) {
  console.error("Book insert error:", bookError);

  await deleteStorageFiles(storageUploads);

  return NextResponse.json(
    {
      error: `Metadata buku gagal disimpan: ${bookError.message}`,
      details: bookError
    },
    { status: 500 }
  );
}

    const fileRows: Omit<BookFile, "created_at" | "updated_at">[] = files.map((file) => ({
      id: randomUUID(),
      book_id: bookId,
      storage_bucket: file.bucket,
      storage_path: file.path,
      storage_provider: file.provider,
      original_name: file.originalName,
      mime_type: file.mimeType,
      file_size: file.fileSize,
      file_kind: file.fileKind,
      page_number: file.pageNumber
    }));

    const { error: fileErrorInsert } = await supabase
      .from("book_files")
      .insert(fileRows);

    if (fileErrorInsert) {
  console.error("Book files insert error:", fileErrorInsert);

  await supabase.from("books").delete().eq("id", bookId);
  await deleteStorageFiles(storageUploads);

  return NextResponse.json(
    {
      error: `Data file buku gagal disimpan: ${fileErrorInsert.message}`,
      details: fileErrorInsert
    },
    { status: 500 }
  );
}

    revalidatePath("/dashboard/books");
    revalidateTag("public-books");

    return NextResponse.json({ book: { id: bookId } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload gagal diselesaikan.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}