import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { createSignedDownloadUrl } from "@/lib/storage/files";
import { incrementDownloadCount } from "@/lib/reading/queries";

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

  const file = (book.book_files || [])[0];

  if (!file) {
    return NextResponse.json({ error: "File buku tidak ditemukan." }, { status: 404 });
  }

  await incrementDownloadCount(book.id, user?.id);

  const signedUrl = await createSignedDownloadUrl(
    file.storage_bucket,
    file.storage_path,
    file.original_name
  );

  return NextResponse.redirect(signedUrl);
}
