import "server-only";

import { createClient } from "@supabase/supabase-js";

function requireServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi.`);
  }

  return value;
}

export function getSupabaseAdminClient() {
  return createClient(
    requireServerEnv("SUPABASE_URL"),
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
