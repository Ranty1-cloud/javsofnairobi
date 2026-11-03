import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (q.get("hub.mode") === "subscribe" && process.env.WHATSAPP_VERIFY_TOKEN && q.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) return new Response(q.get("hub.challenge") ?? "");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET;
  const sig = req.headers.get("x-hub-signature-256") ?? "";
  const want = secret ? "sha256=" + createHmac("sha256", secret).update(raw).digest("hex") : "";
  if (!secret || sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  const body = JSON.parse(raw);
  for (const e of body.entry ?? []) for (const c of e.changes ?? []) for (const s of c.value?.statuses ?? [])
    await db.notification.updateMany({ where: { providerRef: s.id }, data: { status: String(s.status).toUpperCase(), ...(s.status === "failed" ? { error: String(s.errors?.[0]?.title ?? "failed").slice(0, 300) } : {}) } });
  return NextResponse.json({ ok: true });
}
