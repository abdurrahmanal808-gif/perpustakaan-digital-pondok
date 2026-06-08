import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes } from "crypto";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { AppUser, PublicUser, SessionRecord } from "@/lib/db/types";

export const SESSION_COOKIE_NAME = "pondok_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET wajib diisi minimal 32 karakter.");
  }

  return secret;
}

export function hashSessionToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export function toPublicUser(user: AppUser): PublicUser {
  const { password_hash: passwordHash, ...publicUser } = user;
  void passwordHash;
  return publicUser;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const requestHeaders = await headers();
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    user_agent: requestHeaders.get("user-agent"),
    ip_address:
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip"),
    expires_at: expiresAt.toISOString()
  });

  if (error) {
    throw new Error(`Gagal membuat session: ${error.message}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id,user_id,token_hash,user_agent,ip_address,expires_at,revoked_at,created_at,updated_at,users(id,username,full_name,password_hash,role,is_blocked,blocked_reason,created_at,updated_at)"
    )
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const record = data as unknown as SessionRecord & {
    users: AppUser | AppUser[] | null;
  };
  const sessionUser = Array.isArray(record.users)
    ? record.users[0] || null
    : record.users;

  if (!sessionUser) {
    return null;
  }

  return {
    session: record,
    user: toPublicUser(sessionUser)
  };
}

export async function getCurrentUser() {
  const current = await getCurrentSession();
  return current?.user || null;
}

export function loginRedirectPath(nextPath?: string) {
  const params = new URLSearchParams({
    error: "auth_required"
  });

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    params.set("next", nextPath);
  }

  return `/login?${params.toString()}`;
}

export async function requireUser(nextPath?: string) {
  const current = await getCurrentSession();

  if (!current) {
    redirect(loginRedirectPath(nextPath));
  }

  return current;
}

export async function requireActiveUser(nextPath?: string) {
  const current = await requireUser(nextPath);

  if (current.user.is_blocked) {
    redirect("/login?error=blocked");
  }

  return current;
}

export async function requireAdmin() {
  const current = await requireActiveUser();

  if (current.user.role !== "admin") {
    redirect("/dashboard");
  }

  return current;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashSessionToken(token));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
