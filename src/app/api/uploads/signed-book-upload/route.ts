import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { BookType } from "@/lib/db/types";
import {
  bookPageTarget,
  bookPdfTarget,
  coverTarget,
  createSignedUploadUrl
} from "@/lib/storage/files";
import {
  normalizeBookMetadata,
  validateBookMetadata
} from "@/lib/validations/book";
import {
  MAX_COVER_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_BYTES
} from "@/lib/constants";

type ClientFile = {
  name: string;
  type: string;
  size: number;
};

function isPdf(file: ClientFile) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImage(file: ClientFile) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    /\.(jpg|jpeg|png|webp)$/i.test(file.name)
  );
}

function validateClientFiles(bookType: BookType, files: ClientFile[]) {
  if (files.length === 0) {
    return "File buku wajib diupload.";
  }

  const totalSize = files.reduce((total, file) => total + file.size, 0);

  if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
    return `Total file buku terlalu besar. Maksimal ${Math.round(
      MAX_UPLOAD_SIZE_BYTES / 1024 / 1024
    )}MB.`;
  }

  if (bookType === "pdf") {
    if (files.length !== 1) {
      return "Buku PDF hanya boleh memakai satu file PDF.";
    }

    if (!isPdf(files[0])) {
      return "File buku harus berupa PDF.";
    }
  }

  if (bookType === "scan") {
    const invalid = files.find((file) => !isImage(file));

    if (invalid) {
      return "File scan hanya boleh JPG, JPEG, PNG, atau WEBP.";
    }
  }

  return "";
}

function validateClientCover(cover?: ClientFile | null) {
  if (!cover) {
    return "";
  }

  if (!isImage(cover)) {
    return "Cover hanya boleh JPG, JPEG, PNG, atau WEBP.";
  }

  if (cover.size > MAX_COVER_UPLOAD_SIZE_BYTES) {
    return `Cover terlalu besar. Maksimal ${Math.round(
      MAX_COVER_UPLOAD_SIZE_BYTES / 1024 / 1024
    )}MB.`;
  }

  return "";
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

    const body = await request.json();

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
    const files = Array.isArray(body.files) ? (body.files as ClientFile[]) : [];
    const cover = body.cover ? (body.cover as ClientFile) : null;

    const coverError = validateClientCover(cover);

    if (coverError) {
      return NextResponse.json({ error: coverError }, { status: 400 });
    }

    const fileError = validateClientFiles(bookType, files);

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

    const coverUploadTarget = cover
      ? coverTarget(current.user.id, bookId, cover.name)
      : null;

    const signedCover = coverUploadTarget
      ? {
          ...coverUploadTarget,
          ...(await createSignedUploadUrl(
            coverUploadTarget.bucket,
            coverUploadTarget.path,
            coverUploadTarget.provider
          ))
        }
      : null;

    const signedFiles = await Promise.all(
      files.map(async (file, index) => {
        const target =
          bookType === "pdf"
            ? bookPdfTarget(current.user.id, bookId, file.name)
            : bookPageTarget(current.user.id, bookId, index + 1, file.name);

        const signed = await createSignedUploadUrl(
          target.bucket,
          target.path,
          target.provider
        );

        return {
          ...target,
          ...signed,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileKind: bookType === "pdf" ? "pdf" : "page",
          pageNumber: bookType === "scan" ? index + 1 : null
        };
      })
    );

    return NextResponse.json({
      bookId,
      cover: signedCover
        ? {
            ...signedCover,
            originalName: cover?.name || "cover",
            mimeType: cover?.type || "image/jpeg",
            fileSize: cover?.size || 0
          }
        : null,
      files: signedFiles
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat URL upload.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}