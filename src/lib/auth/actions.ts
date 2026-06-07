"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { createSession, revokeCurrentSession } from "@/lib/auth/session";
import {
  normalizeUsername,
  validatePassword,
  validateUsername
} from "@/lib/validations/auth";
import type { AppUser } from "@/lib/db/types";

export type AuthActionState = {
  error?: string;
};

export async function registerUser(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = normalizeUsername(String(formData.get("username") || ""));
  const fullName = String(formData.get("fullName") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  const usernameError = validateUsername(username);
  if (usernameError) {
    return { error: usernameError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  if (password !== passwordConfirm) {
    return { error: "Konfirmasi password tidak sama." };
  }

  const supabase = getSupabaseAdminClient();
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser) {
    return { error: "Username sudah dipakai." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      full_name: fullName || null,
      password_hash: passwordHash,
      role: "user"
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error:
        error?.code === "23505"
          ? "Username sudah dipakai."
          : "Akun gagal dibuat. Coba lagi."
    };
  }

  await createSession(data.id);
  redirect("/dashboard");
}

export async function loginUser(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = normalizeUsername(String(formData.get("username") || ""));
  const password = String(formData.get("password") || "");

  const usernameError = validateUsername(username);
  if (usernameError) {
    return { error: "Username atau password salah." };
  }

  if (!password) {
    return { error: "Password wajib diisi." };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  const user = data as AppUser | null;

  if (error || !user) {
    return { error: "Username atau password salah." };
  }

  if (user.is_blocked) {
    return {
      error: user.blocked_reason
        ? `Akun diblokir: ${user.blocked_reason}`
        : "Akun diblokir."
    };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return { error: "Username atau password salah." };
  }

  await createSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function logoutUser() {
  await revokeCurrentSession();
  redirect("/login");
}
