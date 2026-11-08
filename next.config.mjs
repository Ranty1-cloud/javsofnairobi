// Search-engine hygiene: one canonical host, no framework banner, and a hard "do not index" signal on private areas
// (in addition to robots.txt and each page's own metadata, so a private page can never be indexed by mistake).
const PRIVATE = ["/admin/:path*", "/api/:path*", "/account/:path*", "/booking/:path*", "/ticket/:path*", "/shop/cart", "/shop/orders/:path*", "/shop/orders", "/auth/:path*", "/reset", "/forgot"];
const host = (process.env.NEXT_PUBLIC_SITE_URL || "https://javsofnairobi.co.ke").replace(/^https?:\/\//, "").replace(/\/$/, "");
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    // www -> apex, permanent, so Google sees one site. (Vercel's domain settings can do this too; this is the safety net.)
    return [{ source: "/:path*", has: [{ type: "host", value: `www.${host}` }], destination: `https://${host}/:path*`, permanent: true }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      ...PRIVATE.map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
    ];
  },
};
export default nextConfig;
