import { NextResponse } from "next/server";
import { deleteBook } from "@/lib/books/actions";
import { getCurrentSession } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const current = await getCurrentSession();

  if (!current) {
    return NextResponse.json({ error: "Anda harus login." }, { status: 401 });
  }

  if (current.user.is_blocked) {
    return NextResponse.json({ error: "Akun diblokir." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteBook(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
