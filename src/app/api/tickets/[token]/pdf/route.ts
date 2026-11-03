import { NextResponse } from "next/server";
import { limited, clientIp } from "@/lib/ratelimit";
import { ticketByToken, renderTicketsPdf } from "@/lib/pdf";
// Same access rule as the /ticket/[token] page: the unguessable token is the credential.
export async function GET(req: Request, { params }: { params: { token: string } }) {
  if (limited("pdf:" + clientIp(req), 30)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const t = await ticketByToken(params.token);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bytes = await renderTicketsPdf([t.data]);
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="javs-ticket-${t.reference}-${t.data.seat}.pdf"`, "Cache-Control": "private, no-store" } });
}
