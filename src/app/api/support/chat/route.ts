import { NextResponse } from "next/server";
import { z } from "zod";
import { limited, clientIp } from "@/lib/ratelimit";
import { CLAIMS_PAYMENT, faqMatch, kbText, SUPPORT_RULES } from "@/lib/support-kb";

const body = z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(600) })).min(1).max(10) });
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const HANDOFF = wa ? "I am not sure about that one. A real person can help you on WhatsApp." : "I am not sure about that one. Please use the contact details on our Support page and a real person will help.";
const out = (reply: string, handoff: boolean, status = 200) => NextResponse.json({ reply, handoff }, { status });

export async function POST(req: Request) {
  if (limited("chat:" + clientIp(req), 12)) return out("You are sending messages very fast. Please wait a minute.", false, 429);
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || p.data.messages[p.data.messages.length - 1].role !== "user") return out("Please type a question.", false, 400);
  const msgs = p.data.messages;
  const last = msgs[msgs.length - 1].content;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const m = faqMatch(last);
    return out(m ? m.a : HANDOFF, !m);
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 300, system: `${SUPPORT_RULES}\n\nAPPROVED INFORMATION:\n${kbText()}`, messages: msgs }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) { console.error("support chat provider", r.status); const m = faqMatch(last); return out(m ? m.a : HANDOFF, !m); }
    const j = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (j.content ?? []).filter(c => c.type === "text").map(c => c.text ?? "").join("").trim();
    if (!text) return out(HANDOFF, true);
    if (CLAIMS_PAYMENT.test(text)) return out("I cannot see payments or bookings, so I can not confirm that. A real person can check it against our records. Please message us on WhatsApp with your booking reference.", true);
    return out(text.slice(0, 900), /whatsapp|not sure|human|real person/i.test(text));
  } catch (e) {
    console.error("support chat failed", String(e).slice(0, 200));
    const m = faqMatch(last);
    return out(m ? m.a : HANDOFF, !m);
  }
}
