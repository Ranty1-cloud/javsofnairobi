import { NextResponse } from "next/server";
import { z } from "zod";
import { holdSeats } from "@/lib/seats";
import { holderId } from "@/lib/holder";
import { getSession } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ tripId: z.string(), labels: z.array(z.string()).min(1).max(8) });
export async function POST(req: Request) {
  if (limited("hold:" + clientIp(req), 30)) return NextResponse.json({ error: "Too many requests, slow down" }, { status: 429 });
  if (!(await getSession())) return NextResponse.json({ error: "Please log in or create an account to book seats." }, { status: 401 });
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try { const until = await holdSeats(p.data.tripId, p.data.labels, holderId()); return NextResponse.json({ until }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 409 }); }
}
