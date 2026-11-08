import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TILL } from "@/lib/pay";
import { pageMeta, webPageLd, breadcrumbLd, faqLd, graph } from "@/lib/seo";
// Written from how the site really works (booking flow, seat holds, Till payment, manual confirmation, tickets).
// Keep it in step with the code: src/lib/seats.ts (hold time), src/components/SeatMap.tsx, ManualPay.tsx, lib/support-kb.ts.
const DESC = "How to book a trip with JAVS OF NAIROBI: create an account, pick a trip and seats, pay with M-Pesa Till, and get your QR-code ticket once payment is confirmed.";
export const metadata = pageMeta({ title: "How to Book a Trip", description: DESC, path: "/how-to-book" });
const FAQ = [
  { q: "How do I book a trip with JAVS OF NAIROBI?", a: "Create a free account or log in, open the Trips page, choose a trip, pick your seats, enter a name for each passenger and pay with M-Pesa. An account is required to book." },
  { q: "How long are my seats held?", a: "Seats you select are held for 10 minutes while you complete payment. After that they are released for other customers." },
  { q: "How do I pay for a booking?", a: `Pay with M-Pesa to Buy Goods Till ${TILL}: Lipa na M-Pesa, Buy Goods and Services, enter the Till number and the exact amount shown on your booking page, then submit the 10-character M-Pesa code and the name on your M-Pesa account on the booking page.` },
  { q: "How do I receive my booking confirmation and tickets?", a: "Once our team has checked your payment, the booking page shows Confirmed and each passenger's ticket, with a QR code, appears there and under Account. Tickets can be printed or downloaded as a PDF, and are also emailed, or sent on WhatsApp if you chose that." },
  { q: "Can I cancel a booking?", a: "Unpaid bookings can be cancelled from your account. For a paid booking, contact support with your booking reference. Refund terms are confirmed by JAVS OF NAIROBI." },
];
export default function HowToBook() {
  const crumbs = [{ name: "Home", path: "/" }, { name: "How to book", path: "/how-to-book" }];
  return (
    <div className="wrap narrow prose">
      <JsonLd data={graph(webPageLd({ path: "/how-to-book", name: "How to book a trip", description: DESC }), breadcrumbLd(crumbs), faqLd(FAQ))} />
      <Breadcrumbs items={crumbs} />
      <p className="eyebrow">Guide</p>
      <h1 className="disp" style={{ fontSize: "clamp(2.6rem,7vw,4.8rem)" }}>How to <span className="red">book a trip</span></h1>
      <p><b>In short:</b> create an account, choose a trip and your seats, pay with M-Pesa to our Till, and enter the M-Pesa code. When we confirm your payment, your QR-code tickets are ready.</p>

      <h2>1. Find a trip</h2>
      <p>Open <Link className="red" href="/trips">Trips</Link>. Each trip shows its date, departure time, meeting point, price, any booking fee and how many seats are left. Filter by type, destination, price or seats available, or search by name. Looking for ideas first? Browse the <Link className="red" href="/destinations">destination guides</Link>.</p>

      <h2>2. Create an account or log in</h2>
      <p>You need a free account to book and to see your tickets. <Link className="red" href="/register">Create an account</Link> or <Link className="red" href="/login">log in</Link>.</p>

      <h2>3. Choose your seats</h2>
      <p>On the trip page, pick a seat on the seat map. Some trips run on more than one vehicle, so choose the vehicle first, then your seats. Enter a name for each passenger. Your seats are held for 10 minutes while you pay. If a trip is sold out, join its waitlist.</p>

      <h2>4. Pay with M-Pesa</h2>
      <ol>
        <li>Open M-Pesa and choose <b>Lipa na M-Pesa</b>, then <b>Buy Goods and Services</b>.</li>
        <li>Enter Till number <b>{TILL}</b>.</li>
        <li>Enter the exact amount shown on your booking page.</li>
        <li>Enter your M-Pesa PIN in your own M-Pesa app and send. You never share your PIN with us.</li>
        <li>On your booking page, enter the 10-character M-Pesa code and the name on your M-Pesa account.</li>
      </ol>
      <p>An automatic M-Pesa prompt (STK push) is coming soon. Until then, our team matches your code, name and amount against the M-Pesa statement, so confirmation is not instant.</p>

      <h2>5. Get your tickets</h2>
      <p>When your payment is confirmed, the booking page shows <b>Confirmed</b> and each passenger gets a ticket with a QR code. Find tickets on the booking page and under <Link className="red" href="/account">Account</Link>. Print them or download a PDF. They are also emailed to you, and sent on WhatsApp if you chose that. Show the QR code when boarding. Each code works once.</p>

      <h2>Cancellations and refunds</h2>
      <p>Unpaid bookings can be cancelled from your account. For a paid booking, contact support with your booking reference. Refund terms are confirmed by JAVS OF NAIROBI.</p>

      <h2>Frequently asked questions</h2>
      {FAQ.map(f => <div key={f.q}><h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>{f.q}</h3><p style={{ marginTop: 0 }}>{f.a}</p></div>)}
      <p>Still stuck? Visit <Link className="red" href="/support">Support</Link>.</p>
      <p><Link className="btn" href="/trips">Browse trips</Link></p>
    </div>
  );
}
