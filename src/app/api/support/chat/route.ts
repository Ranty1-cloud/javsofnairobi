import { NextResponse } from "next/server";
import { z } from "zod";
import { limited, clientIp } from "@/lib/ratelimit";
import { faqMatch } from "@/lib/support-kb";

// Free, no AI: matches the question against the approved FAQ (src/lib/support-kb.ts) and otherwise hands off to a person on WhatsApp.
// It never looks at bookings or payments, so it cannot claim any payment outcome.
const body = z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(600) })).min(1).max(10) });
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const HANDOFF = wa ? "I am not sure about that one. A real person can help you on WhatsApp." : "I am not sure about that one. Please use the contact details on our Support page and a real person will help.";
const out = (reply: string, handoff: boolean, status = 200) => NextResponse.json({ reply, handoff }, { status });

export async function POST(req: Request) {
  if (limited("chat:" + clientIp(req), 12)) return out("You are sending messages very fast. Please wait a minute.", false, 429);
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || p.data.messages[p.data.messages.length - 1].role !== "user") return out("Please type a question.", false, 400);
  const m = faqMatch(p.data.messages[p.data.messages.length - 1].content);
  return out(m ? m.a : HANDOFF, !m);
}
