"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  loginUser,
  registerUser,
  type AuthActionState
} from "@/lib/auth/actions";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login";
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    isLogin ? loginUser : registerUser,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const searchParams = useSearchParams();
  const blockedError =
    searchParams.get("error") === "blocked" ? "Akun Anda sedang diblokir." : "";
  const authRequiredError =
    searchParams.get("error") === "auth_required"
      ? "Silakan login terlebih dahulu untuk mengakses perpustakaan."
      : "";
  const redirectTo = searchParams.get("next") || "";
  const switchAuthHref = `${isLogin ? "/register" : "/login"}${
    redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
  }`;
  const passwordHint = useMemo(() => {
    if (isLogin || password.length === 0) {
      return "";
    }

    if (password.length < 8) {
      return "Password minimal 8 karakter.";
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return "Lebih aman jika password berisi huruf dan angka.";
    }

    if (passwordConfirm && password !== passwordConfirm) {
      return "Konfirmasi password belum sama.";
    }

    return "Password terlihat cukup baik.";
  }, [isLogin, password, passwordConfirm]);

  return (
    <div className="w-full max-w-md rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">
          Perpustakaan Digital Pondok
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          {isLogin ? "Masuk ke akun" : "Buat akun baru"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isLogin
            ? "Masuk untuk mengelola buku, rak, favorit, dan riwayat baca."
            : "Gunakan username unik dan password yang kuat untuk mulai berbagi bacaan."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Username</span>
          <input
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            name="username"
            pattern="[a-zA-Z0-9_]{3,30}"
            required
          />
        </label>

        {!isLogin ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Nama lengkap
            </span>
            <input
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
              maxLength={120}
              name="fullName"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <div className="mt-1 flex rounded-md border border-gold/30 bg-white focus-within:border-pondok focus-within:ring-2 focus-within:ring-pondok/10">
            <input
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full rounded-md bg-transparent px-3 py-2 text-sm outline-none"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="px-3 text-slate-500 hover:text-pondok"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {!isLogin ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Konfirmasi password
            </span>
            <div className="mt-1 flex rounded-md border border-gold/30 bg-white focus-within:border-pondok focus-within:ring-2 focus-within:ring-pondok/10">
              <input
                autoComplete="new-password"
                className="w-full rounded-md bg-transparent px-3 py-2 text-sm outline-none"
                minLength={8}
                name="passwordConfirm"
                onChange={(event) => setPasswordConfirm(event.target.value)}
                required
                type={showPasswordConfirm ? "text" : "password"}
              />
              <button
                aria-label={
                  showPasswordConfirm
                    ? "Sembunyikan konfirmasi password"
                    : "Tampilkan konfirmasi password"
                }
                className="px-3 text-slate-500 hover:text-pondok"
                onClick={() => setShowPasswordConfirm((value) => !value)}
                type="button"
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        ) : null}

        {passwordHint ? (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              passwordHint.includes("cukup")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-cream text-clay"
            }`}
          >
            {passwordHint}
          </p>
        ) : null}

        {state.error || blockedError || authRequiredError ? (
          <p
            aria-live="polite"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.error || blockedError || authRequiredError}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={isPending}
          icon={isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
          type="submit"
        >
          {isPending ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <Link
          className="font-semibold text-pondok hover:text-leaf"
          href={switchAuthHref}
        >
          {isLogin ? "Daftar" : "Masuk"}
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link className="font-semibold text-clay hover:text-pondok" href="/catalog">
          Kembali ke katalog
        </Link>
      </p>
    </div>
  );
}
