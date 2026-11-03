import Link from "next/link";
export const metadata = { title: "JAVS OF NAIROBI", description: "Epic road trips. Hidden gems. Unforgettable memories." };
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const css = `body{margin:0;background:#050505;color:#fff;font-family:Inter,system-ui,sans-serif}a{color:inherit;text-decoration:none}
.wrap{padding:6vh 8vw}.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.card{background:#111;border:1px solid #292929;border-radius:14px;padding:20px;display:block}.card:hover{border-color:#E50914}
.btn{background:#E50914;color:#fff;border:0;border-radius:8px;padding:12px 20px;cursor:pointer;display:inline-block}.mut{color:#A1A1A1}
input,textarea,select{background:#111;color:#fff;border:1px solid #292929;border-radius:8px;padding:12px;width:100%;box-sizing:border-box;margin:6px 0}
nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap;padding:16px 8vw;border-bottom:1px solid #292929}nav b{letter-spacing:2px;margin-right:auto}`;
export default function Root({ children }: { children: React.ReactNode }) {
  const links: [string, string][] = [["Trips", "/trips"], ["Destinations", "/destinations"], ["Nganya Culture", "/nganya"], ["News", "/news"], ["Gallery", "/gallery"], ["Support", "/support"], ["Account", "/account"]];
  return (
    <html lang="en"><body><style>{css}</style>
      <nav><b><Link href="/">JAVS <span style={{ color: "#E50914" }}>OF NAIROBI</span></Link></b>{links.map(([n, h]) => <Link key={h} href={h}>{n}</Link>)}<Link className="btn" href="/trips">Book a Seat</Link></nav>
      {children}
      <footer className="wrap mut">TRAVEL. EXPERIENCE. CONNECT. · Nairobi, Kenya</footer>
      {wa && <a href={`https://wa.me/${wa}`} aria-label="WhatsApp" className="btn" style={{ position: "fixed", right: 16, bottom: 16, borderRadius: 99 }}>WhatsApp</a>}
    </body></html>
  );
}
