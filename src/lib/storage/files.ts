import "server-only";

import { BOOK_COVERS_BUCKET, BOOK_FILES_BUCKET } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { StorageProvider } from "@/lib/db/types";
import { sanitizeFileName } from "@/lib/security/filename";
import {
  createR2SignedDownloadUrl,
  createR2SignedReadUrl,
  deleteFileFromR2,
  getStorageBucketForProvider,
  getUploadStorageProvider,
  uploadFileToR2
} from "@/lib/storage/r2";

export type UploadTarget = {
  bucket: string;
  path: string;
  provider: StorageProvider;
};

export async function uploadFileToStorage(file: File, target: UploadTarget) {
  if (target.provider === "r2") {
    await uploadFileToR2(file, target.path);
    return;
  }

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
  files: Array<{ bucket: string; path: string; provider?: StorageProvider }>
) {
  const supabaseFiles = files.filter((file) => (file.provider || "supabase") === "supabase");
  const r2Files = files.filter((file) => file.provider === "r2");

  const supabase = getSupabaseAdminClient();
  const grouped = supabaseFiles.reduce<Record<string, string[]>>((acc, file) => {
    acc[file.bucket] ||= [];
    acc[file.bucket].push(file.path);
    return acc;
  }, {});

  for (const [bucket, paths] of Object.entries(grouped)) {
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }

  await Promise.all(r2Files.map((file) => deleteFileFromR2(file.path)));
}

export async function createSignedReadUrl(
  bucket: string,
  path: string,
  expiresIn = 60 * 10,
  provider: StorageProvider = "supabase"
) {
  if (provider === "r2") {
    return createR2SignedReadUrl(path, expiresIn);
  }

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
  expiresIn = 60 * 5,
  provider: StorageProvider = "supabase"
) {
  if (provider === "r2") {
    return createR2SignedDownloadUrl(path, fileName, expiresIn);
  }

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
  const provider = getUploadStorageProvider();

  return {
    bucket: getStorageBucketForProvider(provider, BOOK_COVERS_BUCKET),
    path: buildCoverPath(userId, bookId, `cover-${Date.now()}-${fileName}`),
    provider
  };
}

export function bookPdfTarget(userId: string, bookId: string, fileName: string) {
  const provider = getUploadStorageProvider();

  return {
    bucket: getStorageBucketForProvider(provider, BOOK_FILES_BUCKET),
    path: buildPdfPath(userId, bookId, fileName),
    provider
  };
}

export function bookPageTarget(
  userId: string,
  bookId: string,
  pageNumber: number,
  fileName: string
) {
  const provider = getUploadStorageProvider();

  return {
    bucket: getStorageBucketForProvider(provider, BOOK_FILES_BUCKET),
    path: buildPagePath(userId, bookId, pageNumber, fileName),
    provider
  };
}
export async function createSignedUploadUrl(
  bucket: string,
  path: string,
  provider: StorageProvider = "supabase"
) {
  if (provider === "r2") {
    throw new Error("Signed upload langsung untuk R2 belum dikonfigurasi.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl || !data?.token) {
    throw new Error("URL upload file gagal dibuat.");
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path || path
  };
}