import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "./db";
import { fmtDate, fmtTime } from "./format";
export type TicketData = { token: string; passenger: string; seat: string; reference: string; title: string; departsAt: Date; meetingPoint: string; paid: boolean };
const include = { seat: true, booking: { include: { trip: true, payments: true } } } as const;
const shape = (t: { token: string; passengerName: string; seat: { label: string }; booking: { reference: string; payments: { status: string }[]; trip: { title: string; departsAt: Date; meetingPoint: string } } }): TicketData => ({
  token: t.token, passenger: t.passengerName, seat: t.seat.label, reference: t.booking.reference, title: t.booking.trip.title, departsAt: t.booking.trip.departsAt, meetingPoint: t.booking.trip.meetingPoint, paid: t.booking.payments.some(p => p.status === "SUCCESS"),
});
// Only CONFIRMED bookings produce tickets. Refunded, cancelled or expired bookings return nothing, same rule as the scanner.
export async function ticketByToken(token: string) {
  const t = await db.ticket.findUnique({ where: { token }, include });
  return t && t.booking.status === "CONFIRMED" ? { data: shape(t), reference: t.booking.reference } : null;
}
export async function ticketsForBooking(bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { tickets: { include: { seat: true }, orderBy: { createdAt: "asc" } }, trip: true, payments: true } });
  if (!b || b.status !== "CONFIRMED" || !b.tickets.length) return null;
  return { reference: b.reference, userId: b.userId, data: b.tickets.map(t => shape({ ...t, booking: b })) };
}
// The built-in PDF fonts only cover Latin-1. Anything else becomes "?" instead of crashing the render.
const safe = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
export async function renderTicketsPdf(tickets: TicketData[]) {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 360, H = 620, red = rgb(0.898, 0.035, 0.078), white = rgb(1, 1, 1), grey = rgb(0.63, 0.63, 0.63);
  for (const t of tickets) {
    const p = pdf.addPage([W, H]);
    p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.067, 0.067, 0.067) });
    p.drawRectangle({ x: 0, y: H - 56, width: W, height: 56, color: red });
    p.drawText("JAVS OF NAIROBI", { x: 24, y: H - 35, size: 16, font: bold, color: white });
    // Long titles wrap onto a second line rather than running off the page.
    const words = safe(t.title).split(" "); const lines: string[] = [""];
    for (const w of words) { const cur = lines[lines.length - 1]; if (bold.widthOfTextAtSize(`${cur} ${w}`.trim(), 20) > W - 48 && lines.length < 2) lines.push(w); else lines[lines.length - 1] = `${cur} ${w}`.trim(); }
    let y = H - 96;
    for (const l of lines) { p.drawText(l, { x: 24, y, size: 20, font: bold, color: white }); y -= 26; }
    const row = (label: string, value: string) => { p.drawText(label.toUpperCase(), { x: 24, y, size: 8, font: reg, color: grey }); p.drawText(safe(value).slice(0, 44), { x: 24, y: y - 14, size: 12, font: bold, color: white }); y -= 38; };
    y -= 6;
    row("Date", `${fmtDate(t.departsAt)}`); row("Departs", fmtTime(t.departsAt)); row("Meeting point", t.meetingPoint);
    row("Passenger", t.passenger); row("Seat", t.seat); row("Booking ref", t.reference);
    row("Payment", t.paid ? "PAID" : "PENDING");
    // The QR carries only the opaque token, never passenger data. The scanner looks everything up server-side.
    const png = await QRCode.toBuffer(t.token, { type: "png", margin: 1, width: 360, color: { dark: "#050505", light: "#ffffff" } });
    const img = await pdf.embedPng(png), size = 150, x = (W - size) / 2;
    p.drawRectangle({ x: x - 8, y: 40, width: size + 16, height: size + 16, color: white });
    p.drawImage(img, { x, y: 48, width: size, height: size });
    p.drawText("Show this code at boarding. One scan per ticket.", { x: 24, y: 22, size: 8, font: reg, color: grey });
  }
  return pdf.save();
}
