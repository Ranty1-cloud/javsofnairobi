import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
// Refreshes the Supabase session cookie and keeps anonymous visitors out of /admin and /account.
// Roles are still verified against the DB in each page and API route.
export async function middleware(req: NextRequest) {
  const gated = req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/account");
  const hasAuthCookie = req.cookies.getAll().some(c => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!gated && !hasAuthCookie) return NextResponse.next(); // public page, nobody signed in: skip the Supabase round trip
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (gated && !user) {
    const url = req.nextUrl.clone(); url.pathname = "/login"; url.search = "";
    const redirect = NextResponse.redirect(url);
    res.cookies.getAll().forEach(c => redirect.cookies.set(c));
    return redirect;
  }
  return res;
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
