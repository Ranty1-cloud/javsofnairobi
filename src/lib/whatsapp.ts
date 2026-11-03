import { db } from "./db";
export async function waSend(to: string, template: string, texts: string[]) {
  const { WHATSAPP_TOKEN: tok, WHATSAPP_PHONE_ID: pid } = process.env;
  if (!tok || !pid) return null;
  const res = await fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: template, language: { code: "en" }, components: [{ type: "body", parameters: texts.map(text => ({ type: "text", text })) }] } }) }).catch(() => null);
  const j = res ? await res.json().catch(() => ({})) : {};
  return (j.messages?.[0]?.id as string | undefined) ?? null;
}
// Official WhatsApp Cloud API. Business-initiated messages must use a template approved in Meta (see README).
export async function notifyBooking(bookingId: string, force = false) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { trip: true, tickets: true, passengers: true } });
  if (!b || b.status !== "CONFIRMED" || !b.tickets.length || !b.whatsappOptIn || !b.phone) return "skipped";
  const { WHATSAPP_TOKEN: tok, WHATSAPP_PHONE_ID: pid, WHATSAPP_TEMPLATE: tpl, APP_URL: app } = process.env;
  if (!tok || !pid || !tpl || !app) return "not_configured";
  // Claim the send. The unique (bookingId, channel) row makes repeated callbacks harmless.
  const n = await db.notification.findUnique({ where: { bookingId_channel: { bookingId, channel: "whatsapp" } } });
  let id = n?.id;
  if (n) {
    const c = await db.notification.updateMany({ where: { id: n.id, ...(force ? {} : { status: "FAILED" }) }, data: { status: "PENDING" } });
    if (c.count === 0) return "already_sent";
  } else {
    try { id = (await db.notification.create({ data: { bookingId, channel: "whatsapp", status: "PENDING" } })).id; } catch { return "already_sent"; }
  }
  const params = [b.passengers[0]?.name ?? "there", b.reference, b.trip.title, `${app}/booking/${b.id}`].map(text => ({ type: "text", text }));
  const res = await fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: b.phone, type: "template", template: { name: tpl, language: { code: "en" }, components: [{ type: "body", parameters: params }] } }),
  }).catch(() => null);
  const j = res ? await res.json().catch(() => ({})) : {};
  const ref: string | undefined = j.messages?.[0]?.id;
  await db.notification.update({ where: { id: id! }, data: { status: ref ? "SENT" : "FAILED", providerRef: ref, error: ref ? null : String(j.error?.message ?? "request failed").slice(0, 300), attempts: { increment: 1 } } });
  return ref ? "sent" : "failed";
}
