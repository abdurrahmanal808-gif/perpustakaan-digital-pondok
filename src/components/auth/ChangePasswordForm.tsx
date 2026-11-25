"use client";

import { useActionState } from "react";
import { changePassword, type AuthActionState } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(changePassword, {});
  return (
    <form action={action} className="mt-6 space-y-4 rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
      <h2 className="text-xl font-bold text-ink">Ganti password</h2>
      <p className="text-sm text-slate-600">Masukkan password saat ini. Setelah berhasil, sesi di perangkat lain akan keluar.</p>
      <label className="block text-sm font-medium">Password saat ini
        <input name="currentPassword" type="password" autoComplete="current-password" required className="mt-1 block w-full rounded-md border border-gold/30 bg-white px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Password baru
        <input name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-1 block w-full rounded-md border border-gold/30 bg-white px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Ulangi password baru
        <input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-1 block w-full rounded-md border border-gold/30 bg-white px-3 py-2" />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}
      <button disabled={pending} type="submit" className="rounded-md bg-pondok px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {pending ? "Menyimpan..." : "Ganti password"}
      </button>
    </form>
  );
}
