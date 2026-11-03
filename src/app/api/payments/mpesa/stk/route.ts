import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { holderId } from "@/lib/holder";
import { total } from "@/lib/pricing";
import { getSession } from "@/lib/session";
const body = z.object({ tripId: z.string(), labels: z.array(z.string()).min(1), phone: z.string().regex(/^(?:254|0)7\d{8}$|^(?:254|0)1\d{8}$/), email: z.string().email().optional(), passengers: z.array(z.object({ label: z.string(), name: z.string().min(2).max(80) })), whatsappOptIn: z.boolean().default(true) });
const base = () => process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

export async function POST(req: Request) {
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { tripId, labels, phone, email, passengers, whatsappOptIn } = p.data;
  const holder = holderId();
  const trip = await db.trip.findUnique({ where: { id: tripId } });
  const seats = await db.tripSeat.findMany({ where: { tripId, label: { in: labels }, status: "RESERVED", heldBy: holder, heldUntil: { gt: new Date() } } });
  if (!trip || seats.length !== labels.length) return NextResponse.json({ error: "Seat hold expired" }, { status: 409 });
  if (!labels.every(l => passengers.some(x => x.label === l))) return NextResponse.json({ error: "A passenger name is needed for every seat" }, { status: 400 });
  const amount = total(seats, trip.bookingFeeKes);
  const booking = await db.booking.create({ data: { reference: "JVS" + Math.random().toString(36).slice(2, 8).toUpperCase(), tripId, guestEmail: email, phone: phone.replace(/^0/, "254"), whatsappOptIn, userId: (await getSession())?.userId, passengers: { create: passengers.filter(x => labels.includes(x.label)) }, totalKes: amount, seats: { connect: seats.map(s => ({ id: s.id })) } } });
  const payment = await db.payment.create({ data: { bookingId: booking.id, provider: "mpesa", idempotencyKey: `${booking.id}:stk`, amountKes: amount, status: "PENDING" } });

  const { MPESA_CONSUMER_KEY: k, MPESA_CONSUMER_SECRET: s, MPESA_SHORTCODE: sc, MPESA_PASSKEY: pk, MPESA_CALLBACK_URL: cb } = process.env;
  if (!k || !s || !sc || !pk || !cb) return NextResponse.json({ error: "M-Pesa is not configured" }, { status: 503 });
  const tok = await (await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: "Basic " + Buffer.from(`${k}:${s}`).toString("base64") } })).json();
  const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const msisdn = phone.replace(/^0/, "254");
  const res = await (await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, { method: "POST", headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ BusinessShortCode: sc, Password: Buffer.from(sc + pk + ts).toString("base64"), Timestamp: ts, TransactionType: "CustomerPayBillOnline", Amount: amount, PartyA: msisdn, PartyB: sc, PhoneNumber: msisdn, CallBackURL: cb, AccountReference: booking.reference, TransactionDesc: trip.title.slice(0, 20) }) })).json();
  if (res.ResponseCode !== "0") { await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawCallback: res } }); return NextResponse.json({ error: "STK push failed" }, { status: 502 }); }
  await db.payment.update({ where: { id: payment.id }, data: { providerRef: res.CheckoutRequestID } });
  return NextResponse.json({ reference: booking.reference, id: booking.id });
}
