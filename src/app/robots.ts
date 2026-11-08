import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
// Public pages are open to every crawler, including search and AI crawlers. Private areas stay closed to all of them.
// A bot with its own group ignores the "*" group, so the same disallow list is repeated for them.
// Names checked against OpenAI's published crawler list (OAI-SearchBot, GPTBot, ChatGPT-User); the others are the vendors' documented tokens.
const PRIVATE = ["/admin", "/api/", "/account", "/booking/", "/ticket/", "/shop/cart", "/shop/orders", "/auth/", "/reset", "/forgot"];
const SEARCH_AND_AI = [
  "Googlebot", "Googlebot-Image", "Bingbot", "DuckDuckBot", "Applebot",                                   // classic search
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",                                           // OpenAI: ChatGPT search, user-requested visits, training
  "PerplexityBot", "Perplexity-User",                                                  // Perplexity: search index, user-requested visits
  "ClaudeBot", "Claude-SearchBot", "Claude-User",                                      // Anthropic
  "Google-Extended", "Applebot-Extended",                                              // opt-in controls for Gemini and Apple AI (they do not crawl themselves)
];
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }, { userAgent: SEARCH_AND_AI, allow: "/", disallow: PRIVATE }], sitemap: `${SITE}/sitemap.xml` };
}
