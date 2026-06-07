import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/books/queries";
import { createSignedDownloadUrl, createSignedReadUrl } from "@/lib/storage/files";
import { incrementDownloadCount } from "@/lib/reading/queries";

type RouteParams = {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { id, fileId } = await params;
  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "1";
  const user = await getCurrentUser();
  const book = await getBookDetail(id, user);

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  const file = (book.book_files || []).find((item) => item.id === fileId);

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }

  if (shouldDownload) {
    await incrementDownloadCount(book.id, user?.id);
  }

  const signedUrl = shouldDownload
    ? await createSignedDownloadUrl(file.storage_bucket, file.storage_path, file.original_name)
    : await createSignedReadUrl(file.storage_bucket, file.storage_path);

  return NextResponse.redirect(signedUrl);
}
