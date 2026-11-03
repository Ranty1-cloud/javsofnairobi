const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const faq: [string, string][] = [
  ["How do I book?", "Pick a trip, choose your seats, enter passenger names and pay with M-Pesa. Seats are held for 10 minutes while you pay."],
  ["Where are my tickets?", "On your booking page and under Account once payment is confirmed. If you ticked WhatsApp delivery, we send the link there too."],
  ["Can I cancel or get a refund?", "Unpaid bookings can be cancelled from your account. For paid bookings, contact support. Refund terms will be confirmed by JAVS OF NAIROBI."],
  ["What if I paid but have no ticket?", "Keep your M-Pesa confirmation message and contact support with your booking reference."],
];
export default function Support() {
  return <main className="wrap" style={{ maxWidth: 720 }}><h1>Support</h1>
    {faq.map(([q, a]) => <details key={q} className="card" style={{ marginBottom: 10 }}><summary><b>{q}</b></summary><p className="mut">{a}</p></details>)}
    {wa ? <p><a className="btn" href={`https://wa.me/${wa}`}>Chat on WhatsApp</a></p> : <p className="mut">Contact details coming soon.</p>}</main>;
}
