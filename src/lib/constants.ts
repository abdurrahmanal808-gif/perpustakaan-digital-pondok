export const APP_NAME = "Perpustakaan Digital Pondok";

export const BOOK_FILES_BUCKET =
  process.env.BOOK_FILES_BUCKET || "book-files";

export const BOOK_COVERS_BUCKET =
  process.env.BOOK_COVERS_BUCKET || "book-covers";

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_BOOK_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const ALLOWED_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const DEFAULT_CATEGORIES = [
  "Kitab Kuning",
  "Fiqih",
  "Aqidah",
  "Akhlak",
  "Tafsir",
  "Hadits",
  "Bahasa Arab",
  "Sejarah Islam",
  "Umum"
] as const;

export const BOOK_TYPES = ["pdf", "scan"] as const;

export const BOOK_STATUSES = ["pending", "published", "hidden", "deleted"] as const;
