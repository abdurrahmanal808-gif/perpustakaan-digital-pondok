import { NextResponse } from "next/server";
import { BOOK_COVERS_BUCKET } from "@/lib/constants";
import { getCurrentSession } from "@/lib/auth/session";
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
  const current = await getCurrentSession();

  if (!current || current.user.is_blocked) {
    return NextResponse.json(
      { error: "Silakan login terlebih dahulu untuk mengakses perpustakaan." },
      { status: 401 }
    );
  }

  const { user } = current;
  const book = await getBookDetail(id, user);

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  let signedFiles: Array<{
    id: string;
    fileKind: string;
    pageNumber: number | null;
    originalName: string;
    mimeType: string;
    url: string;
  }>;
  let coverUrl = "";

  try {
    const files = book.book_files || [];
    signedFiles = await Promise.all(
      files.map(async (file) => ({
        id: file.id,
        fileKind: file.file_kind,
        pageNumber: file.page_number,
        originalName: file.original_name,
        mimeType: file.mime_type,
        url: await createSignedReadUrl(
          file.storage_bucket,
          file.storage_path,
          60 * 10,
          file.storage_provider || "supabase"
        )
      }))
    );
    if (book.cover_path) {
      coverUrl = await createSignedReadUrl(
        BOOK_COVERS_BUCKET,
        book.cover_path,
        60 * 10,
        book.cover_storage_provider || "supabase"
      );
    }
  } catch {
    return NextResponse.json(
      { error: "File baca gagal dibuka. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  await incrementBookView(book.id, user?.id).catch((error) => {
    console.error("Gagal increment view count", error);
  });

  return NextResponse.json({
    bookType: book.book_type,
    coverUrl,
    files: signedFiles
  });
}
