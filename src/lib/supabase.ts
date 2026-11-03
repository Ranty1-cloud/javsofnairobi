import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Request-scoped client: reads/writes the Supabase auth cookies. Use for anything done on behalf of the signed-in visitor.
export function supabaseServer() {
  const jar = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: list => {
        // Server Components cannot set cookies; middleware refreshes the session instead, so ignoring is safe there.
        try { list.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* ignore */ }
      },
    },
  });
}

// Service-role client: can create/invite/update ANY user. Server-only, never import from a client component.
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
