import { db } from "./db";
import { sendMail, emailConfigured, shell, button, esc } from "./email";
import { ticketsForBooking, renderTicketsPdf } from "./pdf";
import { fmtDate, fmtTime, site } from "./format";
// Same claim pattern as WhatsApp: the unique (bookingId, channel) Notification row makes duplicate confirmations harmless.
// Only ever called for CONFIRMED bookings (confirmPayment verified the payment server-side first).
export async function notifyEmail(bookingId: string, force = false) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { trip: true, user: true, passengers: true } });
  // Tickets go to the email typed on the booking and to the account email too, when they differ (usually the customer's Gmail).
  const to = [...new Set([b?.guestEmail, b?.user?.email].filter((e): e is string => !!e).map(e => e.trim().toLowerCase()))];
  if (!b || b.status !== "CONFIRMED" || !to.length) return "skipped";
  if (!emailConfigured()) return "not_configured";
  const pack = await ticketsForBooking(bookingId);
  if (!pack) return "skipped";
  const n = await db.notification.findUnique({ where: { bookingId_channel: { bookingId, channel: "email" } } });
  let id = n?.id;
  if (n) {
    const c = await db.notification.updateMany({ where: { id: n.id, ...(force ? {} : { status: "FAILED" }) }, data: { status: "PENDING" } });
    if (c.count === 0) return "already_sent";
  } else {
    try { id = (await db.notification.create({ data: { bookingId, channel: "email", status: "PENDING" } })).id; } catch { return "already_sent"; }
  }
  const app = site(), t = b.trip, first = b.passengers[0]?.name ?? b.user?.name ?? "there";
  const pdf = Buffer.from(await renderTicketsPdf(pack.data));
  const links = pack.data.map(x => `<li><a style="color:#E50914" href="${esc(`${app}/ticket/${x.token}`)}">Seat ${esc(x.seat)} · ${esc(x.passenger)}</a></li>`).join("");
  const when = `${fmtDate(t.departsAt)} · ${fmtTime(t.departsAt)}`;
  const html = shell("Your booking is confirmed", `<p style="color:#ddd">Hi ${esc(first)}, your payment has been received and your seats are confirmed.</p>
    <p style="margin:0"><b>${esc(t.title)}</b><br><span style="color:#A1A1A1">${esc(when)}<br>Meet at ${esc(t.meetingPoint)}<br>Booking reference ${esc(b.reference)}</span></p>
    <p style="color:#ddd">Your ticket PDF is attached. You can also open each ticket online:</p><ul style="color:#ddd">${links}</ul>${button(`${app}/booking/${b.id}`, "View booking")}
    <p style="color:#A1A1A1;font-size:12px">Show the QR code at boarding. Each code works once.</p>`);
  const text = `Hi ${first}, your booking ${b.reference} for ${t.title} is confirmed.\n${when}\nMeet at ${t.meetingPoint}\n\nTickets are attached as a PDF. View online: ${app}/booking/${b.id}\n`;
  const r = await sendMail({ to, subject: `Confirmed: ${t.title} (${b.reference})`, text, html, attachments: [{ filename: `javs-tickets-${b.reference}.pdf`, content: pdf, contentType: "application/pdf" }] });
  await db.notification.update({ where: { id: id! }, data: { status: r.ok ? "SENT" : "FAILED", providerRef: r.ok ? r.id : undefined, error: r.ok ? null : r.error, attempts: { increment: 1 } } });
  return r.ok ? "sent" : "failed";
}
