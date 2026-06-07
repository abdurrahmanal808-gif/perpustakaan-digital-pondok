import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getCurrentSession } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const current = await getCurrentSession();

    if (!current || current.user.is_blocked) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { user } = current;
    const body = (await request.json().catch(() => ({}))) as {
      lastPage?: number;
      progress?: number;
    };

    const lastPage = Number(body.lastPage || 1);
    const progress = Number(body.progress || 0);
    const supabase = getSupabaseAdminClient();

    await supabase.from("reading_history").upsert(
      {
        user_id: user.id,
        book_id: id,
        last_page: Number.isFinite(lastPage) ? Math.max(1, lastPage) : 1,
        progress_percent: Number.isFinite(progress)
          ? Math.max(0, Math.min(100, progress))
          : 0,
        last_read_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,book_id"
      }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
