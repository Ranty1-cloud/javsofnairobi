# SEO, AEO and AI discovery: how it works and how to run it

Canonical site: **https://javsofnairobi.co.ke** (no `www`). Nobody can promise rankings or AI citations. Success is measured by crawlability, indexing, impressions, clicks, conversions and verified AI referral traffic.

## What is in the code

| Piece | Where | What it does |
| --- | --- | --- |
| Canonical host, page metadata, JSON-LD builders | `src/lib/seo.ts` | One helper (`pageMeta`) gives every page a unique title, description, canonical, Open Graph and X card. Builders produce Organization, WebSite, WebPage, BreadcrumbList, Event (trips), Article (news), TouristDestination, Product (shop) and FAQPage. |
| Sitewide data | `src/app/layout.tsx` | `metadataBase`, title template, default share image, `lang="en-KE"`, verification tags, Organization + WebSite JSON-LD, optional GA4. |
| robots.txt | `src/app/robots.ts` | Allows all crawlers, including search and AI bots (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, Perplexity-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended, Applebot and others). Blocks `/admin`, `/api/`, `/account`, `/booking/`, `/ticket/`, `/shop/cart`, `/shop/orders`, `/auth/`, `/reset`, `/forgot`. Points to the sitemap. |
| sitemap.xml | `src/app/sitemap.ts` | Built from the database: published upcoming trips, destinations, live articles, active shop products and the public pages. `lastModified` only where the database records a date (article publish time). Capped at 50,000 URLs. |
| llms.txt, llms-full.txt | `public/` | Plain-language descriptions for AI systems. Experimental convention, not a ranking factor. They describe stable facts only. Live trips and prices are read from the pages. |
| Manifest and icons | `public/site.webmanifest`, `public/icons/` | Installable-app metadata and the logo as PNG (192, 512, maskable). |
| Share image | `public/og-image.jpg` (1200×630) | Default Open Graph / X image. Trips keep their own generated card (`trips/[slug]/opengraph-image.tsx`). |
| security.txt | `public/.well-known/security.txt` | Points reporters at the Support page. Renew the `Expires` line each year. |
| Headers and redirects | `next.config.mjs` | www → apex permanent redirect, `X-Robots-Tag: noindex` on private areas, basic security headers. |
| Answer content | `/how-to-book`, `/support`, `/about`, `/privacy` | Written from how the site really works. FAQ data appears only on pages that show those questions. |

Filtered or searched views (`/trips?type=…`, `/news?q=…`, `/gallery?c=…`, `/shop?brand=…`) canonicalise to the base page and carry `noindex, follow` so they do not compete with it.

## Environment variables (all optional)

Set in Vercel → Project → Settings → Environment Variables. Never invent a token.

- `NEXT_PUBLIC_SITE_URL`: only if the canonical domain ever changes. Default is `https://javsofnairobi.co.ke`.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`: tokens from the HTML-tag verification method. Skip them if you verify by DNS.
- `NEXT_PUBLIC_GA_ID`: GA4 measurement ID (`G-…`). Nothing loads when empty. The Privacy page updates itself when this is set.
- `NEXT_PUBLIC_SOCIAL_LINKS`: comma-separated `https://` URLs of your **official** profiles. They become `sameAs` in the Organization data. Leave empty until confirmed.
- `NEXT_PUBLIC_WHATSAPP`: already used for the chat button. When set, it is also published as the support contact point in the Organization data.

## One-time setup after deploy

1. **Domain**: in Vercel → Domains, make `javsofnairobi.co.ke` the primary domain and `www.javsofnairobi.co.ke` redirect to it (308/301). The app also redirects www → apex as a safety net.
2. **Check the files** (each should return 200):
   `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/site.webmanifest`, `/.well-known/security.txt`, `/og-image.jpg`.
3. **Google Search Console** (search.google.com/search-console): Add property → *Domain* → add the DNS TXT record at your domain registrar. Then Sitemaps → submit `sitemap.xml`.
4. **Bing Webmaster Tools** (bing.com/webmasters): Import from Google Search Console (fastest), or add the site and verify by DNS or the HTML tag. Then Sitemaps → submit `https://javsofnairobi.co.ke/sitemap.xml`. Bing also feeds Microsoft Copilot and other AI search tools, so this step matters.
5. **Share previews**: test a trip and an article link in the Facebook Sharing Debugger and by pasting into WhatsApp. Re-scrape after changes.
6. **Structured data**: paste a trip, an article, a destination and a product URL into Google's Rich Results Test (search.google.com/test/rich-results) and the Schema.org validator (validator.schema.org). Event, Article and Product data should parse with no errors. Warnings about optional fields are normal.

## Day to day

- **Inspect an indexed URL**: Search Console → URL Inspection → paste the URL → *Test live URL*; use *Request indexing* after publishing something important.
- **Indexing problems**: Search Console → Pages (Indexing). Read each reason: "Crawled, currently not indexed" usually means thin or duplicate content; "Excluded by noindex" on `/login`, `/account` etc. is correct.
- **Search performance**: Search Console → Performance → clicks, impressions, queries, pages. Check weekly.
- **Crawl errors**: Search Console → Settings → Crawl stats, and Pages → "Not found (404)". Bing: Reports & Data → Crawl information.
- **AI referral traffic**: with GA4 on, look at Acquisition → Traffic acquisition for referrers such as `chatgpt.com`, `perplexity.ai`, `copilot.microsoft.com`, `gemini.google.com`.

## When you add or change things

- **New public page**: set `metadata = pageMeta({ title, description, path })`, add it to `PAGES` in `sitemap.ts`, add JSON-LD with `webPageLd` and `breadcrumbLd`.
- **New private page**: add its path to `PRIVATE` in `robots.ts` and `next.config.mjs`, and set `robots: { index: false }`.
- **Changed how booking, payment or refunds work**: update `/how-to-book`, `src/lib/support-kb.ts`, `public/llms-full.txt` and `/privacy` together. Facts must match the live site.
- **Real refund and cancellation terms, full Terms and Conditions**: these have not been published, so the site says refund terms are confirmed by JAVS OF NAIROBI. Add them to `/how-to-book` and the FAQ once decided.
