import type { Metadata } from "next";
// One place for everything search engines and AI systems read: canonical host, page metadata and Schema.org JSON-LD.
// Every fact here comes from the real site (pages, database or environment). Nothing is invented: optional details
// (WhatsApp number, social profiles, verification tokens) only appear when they are configured.

// The canonical production host. Always this one, whatever APP_URL is set to, so canonicals and the sitemap never point at a preview or www URL.
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://javsofnairobi.co.ke").replace(/\/$/, "");
export const BRAND = "JAVS OF NAIROBI";
export const TAGLINE = "Travel. Experience. Connect.";
export const ORG_DESCRIPTION = "JAVS OF NAIROBI organises road trips, destination experiences and Nganya culture events out of Nairobi, Kenya. Customers create an account, choose seats on a trip and pay with M-Pesa.";
export const OG_IMAGE = { url: "/og-image.jpg?v=2", width: 1200, height: 630, alt: `${BRAND}: ${TAGLINE}` };
export const abs = (p: string) => (/^https?:\/\//.test(p) ? p : SITE + (p.startsWith("/") ? p : `/${p}`));
const WA = (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, "");
const SOCIAL = (process.env.NEXT_PUBLIC_SOCIAL_LINKS ?? "").split(",").map(s => s.trim()).filter(s => /^https:\/\//.test(s)); // only confirmed official profiles, comma separated

// Collapses whitespace and cuts at a word boundary so descriptions fit search snippets.
export const clip = (s: string, max = 158) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1), i = cut.lastIndexOf(" ");
  return `${(i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[,;:.\- ]+$/, "")}…`;
};

type Meta = { title: string; description: string; path: string; image?: string | null | false; type?: "website" | "article"; noindex?: boolean; absoluteTitle?: boolean; published?: string };
// Complete, consistent page metadata: title, description, canonical, Open Graph and X card (with the branded default image when a page has none).
// Note: Next replaces a parent's openGraph/twitter objects wholesale, so every page must go through this helper to keep the image.
export function pageMeta(m: Meta): Metadata {
  const image = m.image ? { url: m.image, alt: m.title } : m.image === false ? null : OG_IMAGE; // false: the page has its own opengraph-image file
  return {
    title: m.absoluteTitle ? { absolute: m.title } : m.title,
    description: m.description,
    alternates: { canonical: m.path },
    ...(m.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: m.type ?? "website", url: m.path, siteName: BRAND, locale: "en_KE", title: m.title, description: m.description, ...(image ? { images: [image] } : {}), ...(m.type === "article" && m.published ? { publishedTime: m.published } : {}) },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, ...(image ? { images: [image.url] } : {}) },
  };
}

// ---------- JSON-LD builders ----------
const orgRef = { "@id": `${SITE}/#organization` };
const siteRef = { "@id": `${SITE}/#website` };

export const organizationLd = () => ({
  "@type": "Organization", "@id": orgRef["@id"], name: BRAND, alternateName: "Javs of Nairobi", url: SITE,
  logo: { "@type": "ImageObject", url: abs("/icons/icon-512.png"), width: 512, height: 512 },
  image: abs("/og-image.jpg"), description: ORG_DESCRIPTION, slogan: TAGLINE,
  areaServed: { "@type": "Country", name: "Kenya" },
  ...(WA ? { contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", telephone: `+${WA}`, availableLanguage: ["English"], url: `https://wa.me/${WA}` }] } : {}),
  ...(SOCIAL.length ? { sameAs: SOCIAL } : {}),
});
export const websiteLd = () => ({
  "@type": "WebSite", "@id": siteRef["@id"], url: SITE, name: BRAND, description: ORG_DESCRIPTION, inLanguage: "en-KE", publisher: orgRef,
  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE}/trips?q={search_term_string}` }, "query-input": "required name=search_term_string" },
});
// Sitewide entities, rendered once in the root layout. Pages reference them by @id instead of repeating them.
export const globalLd = () => ({ "@context": "https://schema.org", "@graph": [organizationLd(), websiteLd()] });

export const webPageLd = (p: { path: string; name: string; description: string; type?: "WebPage" | "AboutPage" | "CollectionPage" | "ContactPage" }) => ({
  "@type": p.type ?? "WebPage", "@id": `${abs(p.path)}#webpage`, url: abs(p.path), name: p.name, description: p.description, inLanguage: "en-KE", isPartOf: siteRef, publisher: orgRef,
});
export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});
export const graph = (...nodes: (object | null | undefined | false)[]) => ({ "@context": "https://schema.org", "@graph": nodes.filter(Boolean) });

type TripLd = { slug: string; title: string; summary: string; imageUrl: string | null; departsAt: Date; meetingPoint: string; priceKes: number; destination: { name: string }; left: number };
// A trip is an Event with a ticket offer. Past trips carry no offer, and nothing here claims a booking is confirmed.
export const tripLd = (t: TripLd, now = new Date()) => {
  const url = abs(`/trips/${t.slug}`), upcoming = t.departsAt > now;
  return {
    "@type": "Event", "@id": `${url}#event`, name: t.title, url,
    description: clip(t.summary || `${t.title} to ${t.destination.name}, departing from ${t.meetingPoint}.`, 300),
    startDate: t.departsAt.toISOString(), eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: t.meetingPoint, address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" } },
    image: t.imageUrl ? [t.imageUrl] : [abs("/og-image.jpg")], organizer: orgRef, inLanguage: "en-KE",
    ...(upcoming ? { offers: { "@type": "Offer", url, price: t.priceKes, priceCurrency: "KES", availability: t.left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut", validThrough: t.departsAt.toISOString() } } : {}),
  };
};

type ArticleLd = { slug: string; title: string; excerpt: string; category: string; coverUrl: string | null; author: string; publishedAt: Date };
export const articleLd = (a: ArticleLd) => {
  const url = abs(`/news/${a.slug}`), editorial = /^javs\b/i.test(a.author);
  return {
    "@type": "Article", "@id": `${url}#article`, mainEntityOfPage: { "@id": `${url}#webpage` }, headline: a.title.slice(0, 110), description: clip(a.excerpt || a.title),
    image: [a.coverUrl ?? abs("/og-image.jpg")], datePublished: a.publishedAt.toISOString(), articleSection: a.category, inLanguage: "en-KE",
    author: editorial ? { ...orgRef, name: a.author } : { "@type": "Person", name: a.author }, // the stored author name, never a made-up one
    publisher: orgRef,
  };
};

type DestLd = { slug: string; name: string; description: string; imageUrl: string | null; lat: number | null; lng: number | null };
export const destinationLd = (d: DestLd) => ({
  "@type": "TouristDestination", "@id": `${abs(`/destinations/${d.slug}`)}#destination`, name: d.name, url: abs(`/destinations/${d.slug}`),
  description: clip(d.description, 300), image: d.imageUrl ? [d.imageUrl] : undefined, containedInPlace: { "@type": "Country", name: "Kenya" },
  ...(d.lat != null && d.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng } } : {}),
});

type ProductLd = { slug: string; name: string; brand: string; description: string; priceKes: number; imageUrl: string | null; inStock: boolean };
export const productLd = (p: ProductLd) => {
  const url = abs(`/shop/${p.slug}`);
  return {
    "@type": "Product", "@id": `${url}#product`, name: p.name, url, description: clip(p.description || `${p.name} by ${p.brand}.`, 300), image: p.imageUrl ? [p.imageUrl] : undefined,
    brand: { "@type": "Brand", name: p.brand },
    offers: { "@type": "Offer", url, price: p.priceKes, priceCurrency: "KES", itemCondition: "https://schema.org/NewCondition", availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", seller: orgRef },
  };
};

// Only for pages that really show these questions and answers on screen.
export const faqLd = (items: { q: string; a: string }[]) => ({
  "@type": "FAQPage", mainEntity: items.map(i => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});
