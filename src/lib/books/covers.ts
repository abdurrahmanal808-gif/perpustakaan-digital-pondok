import "server-only";

import { BOOK_COVERS_BUCKET } from "@/lib/constants";
import type { BookWithRelations } from "@/lib/db/types";
import { createSignedReadUrl } from "@/lib/storage/files";

export async function getCoverUrl(book: Pick<BookWithRelations, "cover_path">) {
  if (!book.cover_path) {
    return "";
  }

  try {
    return await createSignedReadUrl(BOOK_COVERS_BUCKET, book.cover_path);
  } catch {
    return "";
  }
}

export async function getCoverUrlMap(books: Array<Pick<BookWithRelations, "id" | "cover_path">>) {
  const entries = await Promise.all(
    books.map(async (book) => [book.id, await getCoverUrl(book)] as const)
  );

  return new Map(entries);
}
