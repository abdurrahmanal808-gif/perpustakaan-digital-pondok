import "server-only";

import { unstable_cache } from "next/cache";
import { BOOK_COVERS_BUCKET } from "@/lib/constants";
import type { BookWithRelations, StorageProvider } from "@/lib/db/types";
import { createSignedReadUrl } from "@/lib/storage/files";

const COVER_SIGNED_URL_TTL_SECONDS = 60 * 60;

const getCachedSignedCoverUrl = unstable_cache(
  async (path: string, provider: StorageProvider) =>
    createSignedReadUrl(
      BOOK_COVERS_BUCKET,
      path,
      COVER_SIGNED_URL_TTL_SECONDS,
      provider
    ),
  ["cover-signed-url-v1"],
  {
    revalidate: 60 * 50
  }
);

export async function getCoverUrl(
  book: Pick<BookWithRelations, "cover_path"> & {
    cover_storage_provider?: StorageProvider | null;
  }
) {
  if (!book.cover_path) {
    return "";
  }

  try {
    return await getCachedSignedCoverUrl(
      book.cover_path,
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
