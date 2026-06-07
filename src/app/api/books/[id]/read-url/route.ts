import { NextResponse } from "next/server";
import { BOOK_COVERS_BUCKET } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { createSignedReadUrl } from "@/lib/storage/files";
import { incrementBookView } from "@/lib/reading/queries";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await getCurrentUser();
  const book = await getBookDetail(id, user);

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  await incrementBookView(book.id, user?.id);

  const files = book.book_files || [];
  const signedFiles = await Promise.all(
    files.map(async (file) => ({
      id: file.id,
      fileKind: file.file_kind,
      pageNumber: file.page_number,
      originalName: file.original_name,
      mimeType: file.mime_type,
      url: await createSignedReadUrl(file.storage_bucket, file.storage_path)
    }))
  );

  const coverUrl = await createSignedReadUrl(BOOK_COVERS_BUCKET, book.cover_path);

  return NextResponse.json({
    bookType: book.book_type,
    coverUrl,
    files: signedFiles
  });
}
