"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { LogIn, UserPlus } from "lucide-react";
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
  const searchParams = useSearchParams();
  const blockedError =
    searchParams.get("error") === "blocked" ? "Akun Anda sedang diblokir." : "";

  return (
    <div className="w-full max-w-md rounded-lg border border-gold/20 bg-bone p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold text-gold">
          Perpustakaan Digital Pondok
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          {isLogin ? "Masuk ke akun" : "Buat akun baru"}
        </h1>
      </div>

      <form action={formAction} className="space-y-4">
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
          <input
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>

        {!isLogin ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Konfirmasi password
            </span>
            <input
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gold/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-pondok focus:ring-2 focus:ring-pondok/10"
              minLength={8}
              name="passwordConfirm"
              required
              type="password"
            />
          </label>
        ) : null}

        {state.error || blockedError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error || blockedError}
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
          href={isLogin ? "/register" : "/login"}
        >
          {isLogin ? "Daftar" : "Masuk"}
        </Link>
      </p>
    </div>
  );
}
