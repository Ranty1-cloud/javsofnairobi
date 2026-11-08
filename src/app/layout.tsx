import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Bebas_Neue } from "next/font/google";
import "./globals.css";
import StaffBar from "@/components/StaffBar";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FloatingHelp from "@/components/FloatingHelp";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import { SITE, BRAND, TAGLINE, ORG_DESCRIPTION, OG_IMAGE, globalLd } from "@/lib/seo";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas", display: "swap" });
const verification = { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined, other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined };
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${BRAND} | Road trips, destinations & Nganya culture from Nairobi`, template: `%s | ${BRAND}` },
  description: ORG_DESCRIPTION,
  applicationName: BRAND,
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { siteName: BRAND, type: "website", locale: "en_KE", url: "/", title: `${BRAND}: ${TAGLINE}`, description: ORG_DESCRIPTION, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: `${BRAND}: ${TAGLINE}`, description: ORG_DESCRIPTION, images: [OG_IMAGE.url] },
  verification,
};
export const viewport: Viewport = { themeColor: "#050505", width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE" className={`${inter.variable} ${grotesk.variable} ${bebas.variable}`}>
      <body>
        <JsonLd data={globalLd()} />
        <a href="#main" className="btn sm skip">Skip to content</a>
        <Nav /><div id="main">{children}</div><Footer />
        <FloatingHelp />
        <StaffBar />
        <Analytics />
      </body>
    </html>
  );
}
