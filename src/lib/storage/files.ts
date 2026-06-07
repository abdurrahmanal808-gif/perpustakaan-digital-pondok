import "server-only";

import { BOOK_COVERS_BUCKET, BOOK_FILES_BUCKET } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { sanitizeFileName } from "@/lib/security/filename";

export type UploadTarget = {
  bucket: string;
  path: string;
};

export async function uploadFileToStorage(file: File, target: UploadTarget) {
  const supabase = getSupabaseAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(target.bucket)
    .upload(target.path, buffer, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    throw new Error(`Upload file gagal: ${error.message}`);
  }
}

export async function deleteStorageFiles(
  files: Array<{ bucket: string; path: string }>
) {
  const supabase = getSupabaseAdminClient();
  const grouped = files.reduce<Record<string, string[]>>((acc, file) => {
    acc[file.bucket] ||= [];
    acc[file.bucket].push(file.path);
    return acc;
  }, {});

  for (const [bucket, paths] of Object.entries(grouped)) {
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}

export async function createSignedReadUrl(
  bucket: string,
  path: string,
  expiresIn = 60 * 10
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error("URL baca file gagal dibuat.");
  }

  return data.signedUrl;
}

export async function createSignedDownloadUrl(
  bucket: string,
  path: string,
  fileName: string,
  expiresIn = 60 * 5
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn, {
      download: sanitizeFileName(fileName)
    });

  if (error || !data?.signedUrl) {
    throw new Error("URL download file gagal dibuat.");
  }

  return data.signedUrl;
}

export function buildCoverPath(userId: string, bookId: string, fileName: string) {
  return `users/${userId}/books/${bookId}/${sanitizeFileName(fileName)}`;
}

export function buildPdfPath(userId: string, bookId: string, fileName: string) {
  return `users/${userId}/books/${bookId}/${sanitizeFileName(fileName)}`;
}

export function buildPagePath(
  userId: string,
  bookId: string,
  pageNumber: number,
  fileName: string
) {
  const extension = sanitizeFileName(fileName).split(".").pop() || "jpg";
  return `users/${userId}/books/${bookId}/pages/page-${String(pageNumber).padStart(
    3,
    "0"
  )}.${extension}`;
}

export function coverTarget(userId: string, bookId: string, fileName: string) {
  return {
    bucket: BOOK_COVERS_BUCKET,
    path: buildCoverPath(userId, bookId, `cover-${Date.now()}-${fileName}`)
  };
}

export function bookPdfTarget(userId: string, bookId: string, fileName: string) {
  return {
    bucket: BOOK_FILES_BUCKET,
    path: buildPdfPath(userId, bookId, fileName)
  };
}

export function bookPageTarget(
  userId: string,
  bookId: string,
  pageNumber: number,
  fileName: string
) {
  return {
    bucket: BOOK_FILES_BUCKET,
    path: buildPagePath(userId, bookId, pageNumber, fileName)
  };
}
