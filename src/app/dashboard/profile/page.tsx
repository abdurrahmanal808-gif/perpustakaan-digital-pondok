import { requireActiveUser } from "@/lib/auth/session";
import { getUserDashboardStats } from "@/lib/books/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireActiveUser();
  const stats = await getUserDashboardStats(user.id);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Profil</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">@{user.username}</h1>
      </div>

      <div className="rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Nama lengkap</dt>
            <dd className="mt-1 font-semibold text-ink">
              {user.full_name || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="mt-1 font-semibold text-ink">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Bergabung</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatDate(user.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd className="mt-1 font-semibold text-ink">
              {user.is_blocked ? "Diblokir" : "Aktif"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-white p-3">
            <p className="text-2xl font-bold">{stats.totalBooks}</p>
            <p className="text-sm text-slate-600">Buku</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-2xl font-bold">{stats.totalFavorites}</p>
            <p className="text-sm text-slate-600">Favorit</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-2xl font-bold">{stats.totalShelves}</p>
            <p className="text-sm text-slate-600">Rak</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-2xl font-bold">{stats.totalHistory}</p>
            <p className="text-sm text-slate-600">Riwayat</p>
          </div>
        </div>
      </div>
    </section>
  );
}
