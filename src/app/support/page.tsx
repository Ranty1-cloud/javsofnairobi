import Link from "next/link";
import { FAQ } from "@/lib/support-kb";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, faqLd, graph } from "@/lib/seo";
const DESC = "Support and FAQs for JAVS OF NAIROBI: how to book, how to pay with M-Pesa, where to find your tickets, cancellations and how to contact us.";
export const metadata = pageMeta({ title: "Support & FAQs", description: DESC, path: "/support" });
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
export default function Support() {
  return <main className="wrap" style={{ maxWidth: 720 }}>
    <JsonLd data={graph(webPageLd({ path: "/support", name: "Support & FAQs", description: DESC }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Support", path: "/support" }]), faqLd(FAQ))} />
    <h1>Support</h1>
    <p className="mut">Quick answers below, or use the chat button for instant help. Our team handles anything about your own booking or payment. New here? Read <Link className="red" href="/how-to-book">how to book</Link>.</p>
    {FAQ.map(f => <details key={f.q} className="card" style={{ marginBottom: 10 }}><summary><b>{f.q}</b></summary><p className="mut">{f.a}</p></details>)}
    {wa ? <><h2 style={{ fontSize: "1.2rem" }}>Contact us</h2><p><a className="btn" href={`https://wa.me/${wa}`}>Chat on WhatsApp</a></p></> : null}</main>;
}
