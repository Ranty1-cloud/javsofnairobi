// Supabase Edge Function (Deno). Sends one transactional email through Resend.
// Deploy:  supabase functions deploy send-email --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="JAVS OF NAIROBI <tickets@your-domain>"
// Only callers holding the project's service-role key are accepted, so this is not an open relay.

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

type Attachment = { filename: string; content: string; contentType?: string };
type Body = { to?: string; subject?: string; text?: string; html?: string; attachments?: Attachment[] };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!service || !safeEqual(token, service)) return json({ error: "unauthorized" }, 401);

  const key = Deno.env.get("RESEND_API_KEY"), from = Deno.env.get("EMAIL_FROM");
  if (!key || !from) return json({ error: "not_configured: set RESEND_API_KEY and EMAIL_FROM as Supabase secrets" }, 503);

  const b = (await req.json().catch(() => null)) as Body | null;
  const emailOk = typeof b?.to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.to) && b.to.length <= 254;
  if (!b || !emailOk || !b.subject || !b.html) return json({ error: "invalid_request" }, 400);
  if ((b.attachments ?? []).reduce((n, a) => n + (a.content?.length ?? 0), 0) > 10_000_000) return json({ error: "attachments_too_large" }, 413);

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from, to: [b.to], subject: b.subject.slice(0, 200), html: b.html, text: b.text,
      attachments: b.attachments?.map(a => ({ filename: a.filename, content: a.content })),
    }),
  });
  const j = await r.json().catch(() => ({})) as { id?: string; message?: string };
  if (!r.ok || !j.id) return json({ error: j.message ?? `provider_error_${r.status}` }, 502);
  return json({ id: j.id });
});
