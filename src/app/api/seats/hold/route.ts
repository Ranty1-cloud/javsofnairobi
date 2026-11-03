import { NextResponse } from "next/server";
import { z } from "zod";
import { holdSeats } from "@/lib/seats";
import { holderId } from "@/lib/holder";
const body = z.object({ tripId: z.string(), labels: z.array(z.string()).min(1).max(8) });
export async function POST(req: Request) {
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try { const until = await holdSeats(p.data.tripId, p.data.labels, holderId()); return NextResponse.json({ until }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 409 }); }
}
