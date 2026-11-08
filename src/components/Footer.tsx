import Link from "next/link";
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
export default function Footer() {
  return (
    <footer className="footer"><div className="wrap footer-grid">
      <div><div className="logo" style={{ marginBottom: 10 }}>JAVS <span className="red">OF NAIROBI</span></div><p className="mut" style={{ maxWidth: 320 }}>TRAVEL. EXPERIENCE. CONNECT. Kenyan road trips, hidden destinations and Nganya culture, out of Nairobi.</p></div>
      <div><h4>Explore</h4><Link href="/trips">Trips</Link><Link href="/how-to-book">How to book</Link><Link href="/destinations">Destinations</Link><Link href="/gallery">Gallery</Link><Link href="/news">News &amp; Stories</Link></div>
      <div><h4>Culture</h4><Link href="/nganya">Nganya Culture</Link><Link href="/nganya#submit">Submit a story</Link><Link href="/about">About us</Link></div>
      <div><h4>Help</h4><Link href="/support">Support &amp; FAQs</Link><Link href="/privacy">Privacy</Link><Link href="/account">My bookings</Link>{wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>}</div>
      <p className="mut" style={{ gridColumn: "1/-1", fontSize: ".78rem", margin: 0 }}>© {new Date().getFullYear()} JAVS OF NAIROBI · Nairobi, Kenya · Prices in Kenyan shillings (KSh)</p>
    </div></footer>
  );
}
