export const APP_NAME = "Perpustakaan Digital Pondok";
export const APP_INSTALL_NAME = "Maktabah Sunsal";
export const APP_SHORT_NAME = "Maktabah";

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

export const BOOK_REPORT_REASONS = [
  "copyright",
  "broken_file",
  "inappropriate_content",
  "wrong_metadata",
  "duplicate",
  "other"
] as const;

export const BOOK_REPORT_STATUSES = [
  "open",
  "reviewing",
  "resolved",
  "rejected"
] as const;

export const BOOK_REPORT_REASON_LABELS = {
  copyright: "Hak cipta atau izin",
  broken_file: "File rusak/tidak bisa dibuka",
  inappropriate_content: "Konten tidak pantas",
  wrong_metadata: "Metadata salah",
  duplicate: "Buku duplikat",
  other: "Lainnya"
} as const;

export const BOOK_REPORT_STATUS_LABELS = {
  open: "Menunggu review",
  reviewing: "Sedang dicek",
  resolved: "Selesai",
  rejected: "Ditolak"
} as const;
