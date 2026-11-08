// Supabase Edge Function (Deno). Sends one transactional email (booking confirmation + PDF ticket).
// Delivery, in order of preference:
//   1. Your own SMTP server, when SMTP_HOST is set.  Use port 465 (SSL): Supabase blocks outbound ports 25 and 587 from Edge Functions.
//   2. Resend, when RESEND_API_KEY is set.
// Deploy:  supabase functions deploy send-email --no-verify-jwt
// Secrets: supabase secrets set SMTP_HOST=mail.example.com SMTP_PORT=465 SMTP_USER=tickets@example.com SMTP_PASS=... EMAIL_FROM="JAVS OF NAIROBI <tickets@example.com>"
// Only callers holding the project's service-role key are accepted, so this is not an open relay.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

type Attachment = { filename: string; content: string; contentType?: string };
type Body = { to?: string | string[]; subject?: string; text?: string; html?: string; attachments?: Attachment[] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function viaSmtp(from: string, to: string[], b: Required<Pick<Body, "subject" | "html">> & Body) {
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  if (port === 25 || port === 587) throw new Error("Supabase blocks outbound ports 25 and 587. Set SMTP_PORT=465 (SSL).");
  const client = new SMTPClient({
    connection: { hostname: Deno.env.get("SMTP_HOST")!, port, tls: port === 465, auth: { username: Deno.env.get("SMTP_USER") ?? "", password: Deno.env.get("SMTP_PASS") ?? "" } },
  });
  try {
    await Promise.race([
      client.send({
        from, to, subject: b.subject.slice(0, 200), content: b.text ?? "", html: b.html,
        attachments: b.attachments?.map(a => ({ filename: a.filename, content: a.content, encoding: "base64", contentType: a.contentType ?? "application/octet-stream" })),
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("smtp_timeout")), 25_000)),
    ]);
  } finally {
    try { await client.close(); } catch { /* connection already closed */ }
  }
  return `smtp:${crypto.randomUUID()}`;
}

async function viaResend(key: string, from: string, to: string[], b: Required<Pick<Body, "subject" | "html">> & Body) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject: b.subject.slice(0, 200), html: b.html, text: b.text, attachments: b.attachments?.map(a => ({ filename: a.filename, content: a.content })) }),
  });
  const j = await r.json().catch(() => ({})) as { id?: string; message?: string };
  if (!r.ok || !j.id) throw new Error(j.message ?? `provider_error_${r.status}`);
  return j.id;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!service || !safeEqual(token, service)) return json({ error: "unauthorized" }, 401);

  const from = Deno.env.get("EMAIL_FROM"), smtp = !!Deno.env.get("SMTP_HOST"), resend = Deno.env.get("RESEND_API_KEY");
  if (!from || (!smtp && !resend)) return json({ error: "not_configured: set EMAIL_FROM plus SMTP_HOST (or RESEND_API_KEY) as Supabase secrets" }, 503);

  const b = (await req.json().catch(() => null)) as Body | null;
  const to = [...new Set((Array.isArray(b?.to) ? b!.to : b?.to ? [b.to] : []).map(s => String(s).trim()))];
  if (!b || !b.subject || !b.html || !to.length || to.length > 5 || to.some(e => !EMAIL.test(e) || e.length > 254)) return json({ error: "invalid_request" }, 400);
  if ((b.attachments ?? []).reduce((n, a) => n + (a.content?.length ?? 0), 0) > 10_000_000) return json({ error: "attachments_too_large" }, 413);

  try {
    const msg = b as Required<Pick<Body, "subject" | "html">> & Body;
    const id = smtp ? await viaSmtp(from, to, msg) : await viaResend(resend!, from, to, msg);
    return json({ id });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e).slice(0, 300) }, 502);
  }
});
