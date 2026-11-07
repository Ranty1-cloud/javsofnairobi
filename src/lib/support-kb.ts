// The ONLY facts the support chat may answer from, and the same list the /support page shows.
// Keep it short and true. Add refund terms, prices and policies here once JAVS OF NAIROBI has confirmed them.
export const FAQ: { q: string; a: string; keywords: string[] }[] = [
  { q: "How do I book?", a: "Pick a trip, choose your seats, enter passenger names and pay with M-Pesa. Seats are held for 10 minutes while you pay.", keywords: ["book", "booking", "reserve", "seat", "seats", "how"] },
  { q: "How do I pay?", a: "Pay with M-Pesa to our Till number 4308216: Lipa na M-Pesa, Buy Goods and Services, enter the Till number and the exact amount shown on your booking page. Then type the 10-character M-Pesa code on the booking page so we can confirm your seats. M-Pesa STK push (an automatic prompt on your phone) is coming soon.", keywords: ["pay", "till", "mpesa", "m-pesa", "stk", "push", "prompt", "number", "buy goods", "lipa"] },
  { q: "Where are my tickets?", a: "On your booking page and under Account once payment is confirmed. If you ticked WhatsApp delivery, we send the link there too. Each ticket has a QR code that is scanned when you board.", keywords: ["ticket", "tickets", "qr", "download", "pdf", "board", "boarding"] },
  { q: "Can I cancel or get a refund?", a: "Unpaid bookings can be cancelled from your account. For paid bookings, contact support. Refund terms will be confirmed by JAVS OF NAIROBI.", keywords: ["cancel", "refund", "money back", "change"] },
  { q: "What if I paid but have no ticket?", a: "Keep your M-Pesa confirmation message and contact support with your booking reference. A person will check it against our payment records.", keywords: ["paid", "payment", "mpesa", "m-pesa", "no ticket", "pending", "charged"] },
];

// Plain keyword match against the FAQ. No AI, so it never makes anything up.
export function faqMatch(text: string) {
  const t = text.toLowerCase();
  let best: (typeof FAQ)[number] | null = null, score = 0;
  for (const f of FAQ) { const s = f.keywords.filter(k => t.includes(k)).length; if (s > score) { score = s; best = f; } }
  return score ? best : null;
}
