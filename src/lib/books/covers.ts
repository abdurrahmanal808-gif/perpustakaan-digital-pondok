import "server-only";

import { BOOK_COVERS_BUCKET } from "@/lib/constants";
import type { BookWithRelations, StorageProvider } from "@/lib/db/types";
import { createSignedReadUrl } from "@/lib/storage/files";

export async function getCoverUrl(
  book: Pick<BookWithRelations, "cover_path"> & {
    cover_storage_provider?: StorageProvider | null;
  }
) {
  if (!book.cover_path) {
    return "";
  }

  try {
    return await createSignedReadUrl(
      BOOK_COVERS_BUCKET,
      book.cover_path,
      60 * 10,
      book.cover_storage_provider || "supabase"
    );
  } catch {
    return "";
  }
}

export async function getCoverUrlMap(
  books: Array<
    Pick<BookWithRelations, "id" | "cover_path"> & {
      cover_storage_provider?: StorageProvider | null;
    }
  >
) {
  const entries = await Promise.all(
    books.map(async (book) => [book.id, await getCoverUrl(book)] as const)
  );

  return new Map(entries);
}
