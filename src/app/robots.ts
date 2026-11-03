import type { MetadataRoute } from "next";
import { site } from "@/lib/format";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/booking", "/ticket", "/reset", "/forgot"] }], sitemap: `${site()}/sitemap.xml` };
}
