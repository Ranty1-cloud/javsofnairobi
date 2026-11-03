import { NextResponse, type NextRequest } from "next/server";
// Cheap edge gate: anonymous visitors never reach account/admin pages. Roles are still verified against the DB in each page and API route.
export function middleware(req: NextRequest) {
  if (!req.cookies.get("session")?.value) {
    const url = req.nextUrl.clone(); url.pathname = "/login"; url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
