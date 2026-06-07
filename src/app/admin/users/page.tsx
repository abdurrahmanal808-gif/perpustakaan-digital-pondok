import {
  adminBlockUser,
  adminUnblockUser,
  adminUpdateUserRole
} from "@/lib/admin/actions";
import { adminGetUsers } from "@/lib/admin/queries";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await adminGetUsers();

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Manajemen User</h1>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <article
            className="rounded-lg border border-gold/20 bg-bone p-5 shadow-sm"
            key={user.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-bold text-ink">@{user.username}</h2>
                <p className="text-sm text-slate-600">
                  {user.full_name || "-"} · {user.role} ·{" "}
                  {user.is_blocked ? "diblokir" : "aktif"}
                </p>
                {user.blocked_reason ? (
                  <p className="mt-1 text-sm text-red-700">{user.blocked_reason}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={adminUpdateUserRole} className="flex gap-2">
                  <input name="userId" type="hidden" value={user.id} />
                  <select
                    className="min-h-10 rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                    defaultValue={user.role}
                    name="role"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button type="submit" variant="secondary">
                    Ubah role
                  </Button>
                </form>

                {user.is_blocked ? (
                  <form action={adminUnblockUser}>
                    <input name="userId" type="hidden" value={user.id} />
                    <Button type="submit">Aktifkan</Button>
                  </form>
                ) : (
                  <form action={adminBlockUser} className="flex gap-2">
                    <input name="userId" type="hidden" value={user.id} />
                    <input
                      className="min-h-10 rounded-md border border-gold/30 bg-white px-3 py-2 text-sm"
                      name="reason"
                      placeholder="Alasan blokir"
                    />
                    <Button type="submit" variant="danger">
                      Blokir
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
