import { NextResponse } from "next/server";
import { getCurrentSession, loginRedirectPath } from "@/lib/auth/session";
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
  const current = await getCurrentSession();

  if (!current || current.user.is_blocked) {
    return NextResponse.redirect(loginRedirectPath(`/api/books/${id}/download`), 302);
  }

  const { user } = current;
  const book = await getBookDetail(id, user);

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  }

  const file = (book.book_files || [])[0];

  if (!file) {
    return NextResponse.json({ error: "File buku tidak ditemukan." }, { status: 404 });
  }

  let signedUrl: string;

  try {
    signedUrl = await createSignedDownloadUrl(
      file.storage_bucket,
      file.storage_path,
      file.original_name
    );
  } catch {
    return NextResponse.json(
      { error: "Link download gagal dibuat. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  await incrementDownloadCount(book.id, user?.id).catch((error) => {
    console.error("Gagal increment download count", error);
  });

  return NextResponse.redirect(signedUrl, 302);
}
