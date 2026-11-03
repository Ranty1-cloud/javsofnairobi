import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
// Edge gate: anonymous visitors never reach account/admin pages, and the Supabase session cookie is refreshed here.
// Roles are still verified against the DB in each page and API route.
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const toLogin = () => { const u = req.nextUrl.clone(); u.pathname = "/login"; u.search = ""; return NextResponse.redirect(u); };
  if (!url || !key) return toLogin();
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return data.user ? res : toLogin();
}
export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
