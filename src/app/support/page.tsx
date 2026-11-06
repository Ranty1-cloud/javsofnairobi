import { FAQ } from "@/lib/support-kb";
export const metadata = { title: "Support" };
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
export default function Support() {
  return <main className="wrap" style={{ maxWidth: 720 }}><h1>Support</h1>
    <p className="mut">Quick answers below, or use the chat button for instant help. Our team handles anything about your own booking or payment.</p>
    {FAQ.map(f => <details key={f.q} className="card" style={{ marginBottom: 10 }}><summary><b>{f.q}</b></summary><p className="mut">{f.a}</p></details>)}
    {wa ? <p><a className="btn" href={`https://wa.me/${wa}`}>Chat on WhatsApp</a></p> : <p className="mut">Contact details coming soon.</p>}</main>;
}
