import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site } from "@/lib/format";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(site()),
  title: { default: "JAVS OF NAIROBI | Adventure. Culture. Nairobi.", template: "%s | JAVS OF NAIROBI" },
  description: "Epic road trips. Hidden gems. Unforgettable memories. Kenyan adventure travel and Nganya culture from Nairobi.",
  openGraph: { siteName: "JAVS OF NAIROBI", type: "website", locale: "en_KE" },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#050505", width: "device-width", initialScale: 1 };
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${bebas.variable}`}>
      <body>
        <a href="#main" className="btn sm skip">Skip to content</a>
        <Nav /><div id="main">{children}</div><Footer />
        {wa && <a href={`https://wa.me/${wa}`} aria-label="Chat on WhatsApp" className="wa-float" target="_blank" rel="noreferrer">WhatsApp us</a>}
      </body>
    </html>
  );
}
