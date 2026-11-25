"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { createSession, revokeCurrentSession, requireActiveUser } from "@/lib/auth/session";
import {
  normalizeUsername,
  validatePassword,
  validateUsername
} from "@/lib/validations/auth";
import type { AppUser } from "@/lib/db/types";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = String(value || "");

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "";
  }

  return path;
}

export async function registerUser(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = normalizeUsername(String(formData.get("username") || ""));
  const fullName = String(formData.get("fullName") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

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
  redirect(redirectTo || "/dashboard");
}

export async function loginUser(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = normalizeUsername(String(formData.get("username") || ""));
  const password = String(formData.get("password") || "");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  const usernameError = validateUsername(username);
  if (usernameError) {
    return { error: "Username atau password salah." };
  }

  if (!password) {
    return { error: "Password wajib diisi." };
  }

  const supabase = getSupabaseAdminClient();
  const { data: locked, error: lockError } = await supabase.rpc("login_attempt_status", { p_username: username });
  if (lockError) throw new Error("Proteksi login belum tersedia. Jalankan supabase/login-protection.sql.");
  if (locked) return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  const user = data as AppUser | null;

  if (error || !user) {
    await supabase.rpc("record_login_failure", { p_username: username });
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
    await supabase.rpc("record_login_failure", { p_username: username });
    return { error: "Username atau password salah." };
  }

  await supabase.rpc("clear_login_attempts", { p_username: username });
  await createSession(user.id);
  redirect(redirectTo || (user.role === "admin" ? "/admin" : "/dashboard"));
}

export async function logoutUser() {
  await revokeCurrentSession();
  redirect("/login");
}

export async function changePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const { user, session } = await requireActiveUser("/dashboard/profile");
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmation = String(formData.get("confirmation") || "");
  const validationError = validatePassword(newPassword);
  if (validationError) return { error: validationError };
  if (newPassword !== confirmation) return { error: "Konfirmasi password tidak sama." };
  if (currentPassword === newPassword) return { error: "Password baru harus berbeda." };

  const supabase = getSupabaseAdminClient();
  const { data: account, error } = await supabase.from("users")
    .select("password_hash").eq("id", user.id).single();
  if (error || !account || !(await bcrypt.compare(currentPassword, account.password_hash))) {
    return { error: "Password saat ini salah." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const { error: updateError } = await supabase.from("users")
    .update({ password_hash: passwordHash }).eq("id", user.id);
  if (updateError) return { error: "Gagal mengganti password. Coba lagi." };
  await supabase.from("sessions").update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id).neq("id", session.id).is("revoked_at", null);
  return { success: "Password berhasil diganti. Sesi lain telah dikeluarkan." };
}
