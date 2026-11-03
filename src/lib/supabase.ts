import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const supabaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Server-side Supabase client bound to the request cookies. Works in server components, route handlers and server actions.
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => {
        // Server components cannot set cookies; middleware refreshes the session there, so ignoring is safe.
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only context */ }
      },
    },
  });
}
