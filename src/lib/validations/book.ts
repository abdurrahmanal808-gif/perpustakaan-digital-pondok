import {
  ALLOWED_BOOK_MIME_TYPES,
  ALLOWED_COVER_MIME_TYPES,
  BOOK_STATUSES,
  BOOK_TYPES,
  MAX_UPLOAD_SIZE_BYTES
} from "@/lib/constants";
import type { BookStatus, BookType } from "@/lib/db/types";
import { getFileExtension } from "@/lib/security/filename";

const allowedBookExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const allowedCoverExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export type BookMetadataInput = {
  title: string;
  author: string;
  description: string;
  categoryId: string;
  bookType: string;
  status?: string;
  rightsConfirmed: boolean;
};

export function normalizeBookMetadata(input: BookMetadataInput) {
  return {
    title: input.title.trim(),
    author: input.author.trim(),
    description: input.description.trim(),
    categoryId: input.categoryId.trim(),
    bookType: input.bookType.trim() as BookType,
    status: (input.status || "pending").trim() as BookStatus,
    rightsConfirmed: input.rightsConfirmed
  };
}

export function validateBookMetadata(input: BookMetadataInput) {
  const metadata = normalizeBookMetadata(input);

  if (!metadata.title || metadata.title.length > 180) {
    return "Judul wajib diisi dan maksimal 180 karakter.";
  }

  if (metadata.author.length > 140) {
    return "Nama penulis maksimal 140 karakter.";
  }

  if (!metadata.categoryId) {
    return "Kategori wajib dipilih.";
  }

  if (!BOOK_TYPES.includes(metadata.bookType)) {
    return "Jenis buku tidak valid.";
  }

  if (!BOOK_STATUSES.includes(metadata.status)) {
    return "Status buku tidak valid.";
  }

  if (metadata.description.length > 1600) {
    return "Deskripsi maksimal 1600 karakter.";
  }

  if (!metadata.rightsConfirmed) {
    return "Anda harus menyetujui pernyataan hak/izin berbagi file.";
  }

  return null;
}

export function validateCoverFile(file: File) {
  const extension = getFileExtension(file.name);

  if (
    !ALLOWED_COVER_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_COVER_MIME_TYPES)[number]
    ) ||
    !allowedCoverExtensions.has(extension)
  ) {
    return "Cover harus JPG, JPEG, PNG, atau WEBP.";
  }

  if (file.size <= 0) {
    return "Cover tidak boleh kosong.";
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "Cover terlalu besar.";
  }

  return null;
}

export function validateBookFiles(bookType: BookType, files: File[]) {
  if (files.length === 0) {
    return "File buku wajib diupload.";
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
    return "Total ukuran file maksimal 50MB.";
  }

  if (bookType === "pdf" && files.length !== 1) {
    return "Buku PDF hanya boleh memiliki satu file PDF.";
  }

  for (const file of files) {
    const extension = getFileExtension(file.name);
    const allowedMime = ALLOWED_BOOK_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_BOOK_MIME_TYPES)[number]
    );

    if (!allowedMime || !allowedBookExtensions.has(extension)) {
      return "File buku hanya boleh PDF, JPG, JPEG, PNG, atau WEBP.";
    }

    if (bookType === "pdf" && file.type !== "application/pdf") {
      return "Jenis PDF harus menggunakan file PDF.";
    }

    if (bookType === "scan" && file.type === "application/pdf") {
      return "Jenis scan gambar hanya boleh JPG, JPEG, PNG, atau WEBP.";
    }

    if (file.size <= 0) {
      return "File buku tidak boleh kosong.";
    }
  }

  return null;
}
