// Supabase Edge Function (Deno). Sends one transactional email (booking confirmation + PDF ticket) through Brevo.
// Resend still works as a fallback: it is used only when BREVO_API_KEY is not set.
// Deploy:  supabase functions deploy send-email --no-verify-jwt
// Secrets: supabase secrets set BREVO_API_KEY=xkeysib-... EMAIL_FROM="JAVS OF NAIROBI <noreply@your-domain>"
//   BREVO_API_KEY is the API key (Brevo > SMTP & API > API Keys), not the SMTP key. EMAIL_FROM must be a sender or domain verified in Brevo.
// Only callers holding the project's service-role key are accepted, so this is not an open relay.

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

// "JAVS OF NAIROBI <noreply@x.ke>" -> { name, email }. A bare address works too.
function parseFrom(from: string): { name?: string; email: string } {
  const m = /^\s*(.*?)\s*<([^<>\s]+)>\s*$/.exec(from);
  return m ? { ...(m[1] ? { name: m[1].replace(/^"(.*)"$/, "$1") } : {}), email: m[2] } : { email: from.trim() };
}

type Attachment = { filename: string; content: string; contentType?: string };
type Body = { to?: string; subject?: string; text?: string; html?: string; attachments?: Attachment[] };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!service || !safeEqual(token, service)) return json({ error: "unauthorized" }, 401);

  const brevoKey = Deno.env.get("BREVO_API_KEY"), resendKey = Deno.env.get("RESEND_API_KEY"), from = Deno.env.get("EMAIL_FROM");
  if (!from || !(brevoKey || resendKey)) return json({ error: "not_configured: set BREVO_API_KEY and EMAIL_FROM as Supabase secrets" }, 503);

  const b = (await req.json().catch(() => null)) as Body | null;
  const emailOk = typeof b?.to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.to) && b.to.length <= 254;
  if (!b || !emailOk || !b.subject || !b.html) return json({ error: "invalid_request" }, 400);
  // Brevo allows about 4 MB of attachments per email; the PDF ticket is far smaller than that.
  if ((b.attachments ?? []).reduce((n, a) => n + (a.content?.length ?? 0), 0) > (brevoKey ? 5_000_000 : 10_000_000)) return json({ error: "attachments_too_large" }, 413);

  try {
    if (brevoKey) {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: parseFrom(from), to: [{ email: b.to }], subject: b.subject.slice(0, 200), htmlContent: b.html, ...(b.text ? { textContent: b.text } : {}),
          ...(b.attachments?.length ? { attachment: b.attachments.map(a => ({ name: a.filename, content: a.content })) } : {}),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const j = await r.json().catch(() => ({})) as { messageId?: string; message?: string };
      if (!r.ok || !j.messageId) return json({ error: j.message ?? `provider_error_${r.status}` }, 502);
      return json({ id: j.messageId });
    }
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from, to: [b.to], subject: b.subject.slice(0, 200), html: b.html, text: b.text,
        attachments: b.attachments?.map(a => ({ filename: a.filename, content: a.content })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const j = await r.json().catch(() => ({})) as { id?: string; message?: string };
    if (!r.ok || !j.id) return json({ error: j.message ?? `provider_error_${r.status}` }, 502);
    return json({ id: j.id });
  } catch (e) {
    return json({ error: `provider_unreachable: ${String(e).slice(0, 120)}` }, 502);
  }
});
