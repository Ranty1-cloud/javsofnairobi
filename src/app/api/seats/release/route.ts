import { NextResponse } from "next/server";
import { releaseSeats } from "@/lib/seats";
import { holderId } from "@/lib/holder";
export async function POST(req: Request) {
  const { tripId, labels } = await req.json();
  await releaseSeats(tripId, labels, holderId());
  return NextResponse.json({ ok: true });
}
