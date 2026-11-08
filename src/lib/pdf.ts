import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "./db";
import { fmtDate, fmtTime } from "./format";
import { qrLayout, QUIET } from "./ticket-qr";
import { LOGO_PNG_B64 } from "./brand-logo";
export type TicketData = { token: string; passenger: string; seat: string; vehicle: string; reference: string; title: string; departsAt: Date; meetingPoint: string; paid: boolean };
const include = { seat: { include: { tripVehicle: { select: { name: true } } } }, booking: { include: { trip: true, payments: true } } } as const;
const shape = (t: { token: string; passengerName: string; seat: { label: string; tripVehicle?: { name: string } | null }; booking: { reference: string; payments: { status: string }[]; trip: { title: string; departsAt: Date; meetingPoint: string } } }): TicketData => ({
  token: t.token, passenger: t.passengerName, seat: t.seat.label, vehicle: t.seat.tripVehicle?.name ?? "", reference: t.booking.reference, title: t.booking.trip.title, departsAt: t.booking.trip.departsAt, meetingPoint: t.booking.trip.meetingPoint, paid: t.booking.payments.some(p => p.status === "SUCCESS"),
});
// Only CONFIRMED bookings produce tickets. Refunded, cancelled or expired bookings return nothing, same rule as the scanner.
export async function ticketByToken(token: string) {
  const t = await db.ticket.findUnique({ where: { token }, include });
  return t && t.booking.status === "CONFIRMED" ? { data: shape(t), reference: t.booking.reference } : null;
}
export async function ticketsForBooking(bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { tickets: { include: { seat: { include: { tripVehicle: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } }, trip: true, payments: true } });
  if (!b || b.status !== "CONFIRMED" || !b.tickets.length) return null;
  return { reference: b.reference, userId: b.userId, data: b.tickets.map(t => shape({ ...t, booking: b })) };
}
// The built-in PDF fonts only cover Latin-1. Anything else becomes "?" instead of crashing the render.
const safe = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
const shortCode = (token: string) => token.slice(0, 8).toUpperCase();
export async function renderTicketsPdf(tickets: TicketData[]) {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  // Light, ink-friendly boarding pass: prints cleanly on any home or office printer.
  const W = 360, H = 640, red = rgb(0.898, 0.035, 0.078), ink = rgb(0.04, 0.04, 0.04), white = rgb(1, 1, 1), grey = rgb(0.45, 0.45, 0.45), line = rgb(0.85, 0.85, 0.85);
  const rrect = (w: number) => (r: number) => `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${w - r} A ${r} ${r} 0 0 1 ${w - r} ${w} H ${r} A ${r} ${r} 0 0 1 0 ${w - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  const logo = await pdf.embedPng(Buffer.from(LOGO_PNG_B64, "base64"));
  for (const t of tickets) {
    const p = pdf.addPage([W, H]);
    p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
    p.drawRectangle({ x: 0, y: H - 78, width: W, height: 78, color: ink });
    p.drawRectangle({ x: 0, y: H - 82, width: W, height: 4, color: red });
    p.drawImage(logo, { x: 24, y: H - 66, width: 54, height: 54 });
    p.drawText("BOARDING PASS", { x: 90, y: H - 40, size: 15, font: bold, color: white });
    p.drawText("TRAVEL. EXPERIENCE. CONNECT.", { x: 90, y: H - 55, size: 6.5, font: reg, color: rgb(0.7, 0.7, 0.7) });
    const tag = t.paid ? "PAID" : "PENDING", tw = bold.widthOfTextAtSize(tag, 10);
    p.drawRectangle({ x: W - 24 - tw - 20, y: H - 52, width: tw + 20, height: 22, color: t.paid ? red : rgb(0.85, 0.64, 0) });
    p.drawText(tag, { x: W - 24 - tw - 10, y: H - 45, size: 10, font: bold, color: white });
    // Long titles wrap onto a second line rather than running off the page.
    const words = safe(t.title).split(" "); const lines: string[] = [""];
    for (const w of words) { const cur = lines[lines.length - 1]; if (bold.widthOfTextAtSize(`${cur} ${w}`.trim(), 22) > W - 48 && lines.length < 2) lines.push(w); else lines[lines.length - 1] = `${cur} ${w}`.trim(); }
    let y = H - 118;
    for (const l of lines) { p.drawText(l, { x: 24, y, size: 22, font: bold, color: ink }); y -= 27; }
    const cell = (label: string, value: string, x: number, yy: number, size = 12) => { p.drawText(label.toUpperCase(), { x, y: yy, size: 7.5, font: reg, color: grey }); p.drawText(safe(value).slice(0, 26), { x, y: yy - (size > 12 ? 20 : 15), size, font: bold, color: ink }); };
    y -= 10;
    cell("Date", fmtDate(t.departsAt), 24, y); cell("Departs", fmtTime(t.departsAt), 210, y); y -= 44;
    p.drawText("MEETING POINT", { x: 24, y, size: 7.5, font: reg, color: grey }); p.drawText(safe(t.meetingPoint).slice(0, 48), { x: 24, y: y - 15, size: 12, font: bold, color: ink }); y -= 44;
    cell("Passenger", t.passenger, 24, y); cell("Seat", t.seat, 210, y, 20);
    if (t.vehicle) p.drawText(safe(t.vehicle).slice(0, 24), { x: 210, y: y - 33, size: 7.5, font: reg, color: grey });
    y -= 44;
    cell("Booking ref", t.reference, 24, y); cell("Ticket code", shortCode(t.token), 210, y); y -= 30;
    // Perforation line with notches.
    p.drawLine({ start: { x: 22, y }, end: { x: W - 22, y }, thickness: 1, color: line, dashArray: [4, 4] });
    p.drawCircle({ x: 0, y, size: 11, color: rgb(0.93, 0.93, 0.93) }); p.drawCircle({ x: W, y, size: 11, color: rgb(0.93, 0.93, 0.93) });
    // Styled QR (level H). It carries only the opaque token; the scanner looks everything up server-side.
    const L = qrLayout(t.token), size = 190, u = size / L.total, qx = (W - size) / 2, qy = 52;
    p.drawRectangle({ x: qx - 10, y: qy - 10, width: size + 20, height: size + 20, borderColor: line, borderWidth: 1, color: white });
    const cx = (c: number) => qx + (c + QUIET) * u, cy = (r: number) => qy + size - (r + QUIET) * u;
    for (const [r, c] of L.dots) p.drawCircle({ x: cx(c) + u / 2, y: cy(r) - u / 2, size: u * 0.47, color: ink });
    for (const [r, c] of L.eyes) {
      const ox = cx(c), oy = cy(r);
      p.drawSvgPath(rrect(7 * u)(2 * u), { x: ox, y: oy, color: ink, borderWidth: 0 });
      p.drawSvgPath(rrect(5 * u)(1.4 * u), { x: ox + u, y: oy - u, color: white, borderWidth: 0 });
      p.drawSvgPath(rrect(3 * u)(0.9 * u), { x: ox + 2 * u, y: oy - 2 * u, color: red, borderWidth: 0 });
    }
    if (L.half) {
      const bx = cx(L.mid) + u / 2, by = cy(L.mid) - u / 2;
      // The centre of the code is kept empty (7x7 modules); the official logo sits in it.
      p.drawRectangle({ x: bx - u * 3.5, y: by - u * 3.5, width: u * 7, height: u * 7, color: white });
      p.drawImage(logo, { x: bx - u * 3.2, y: by - u * 3.2, width: u * 6.4, height: u * 6.4 });
    }
    p.drawText("Show this code at boarding. One scan per ticket.", { x: 24, y: 22, size: 8, font: reg, color: grey });
    p.drawText(`${shortCode(t.token)}`, { x: W - 24 - reg.widthOfTextAtSize(shortCode(t.token), 8), y: 22, size: 8, font: reg, color: grey });
  }
  return pdf.save();
}
