// Email goes through Supabase. Two paths, both owned by your Supabase project:
//  1. Auth emails (sign-up confirmation, invites, password reset): sent by Supabase Auth itself, nothing in this file.
//  2. Transactional emails (booking confirmation + PDF ticket): sent by the `send-email` Edge Function in supabase/functions.
// Supabase has no generic "send any email" API, so that function delivers through your own SMTP server (port 465) or Resend, using credentials kept as Supabase secrets.
// The Next.js app never holds mail credentials. We never pretend a mail went out: failures come back as { ok: false }.
export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

export const emailConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendMail(m: { to: string | string[]; subject: string; text: string; html: string; attachments?: MailAttachment[] }) {
  if (!emailConfigured()) return { ok: false as const, error: "not_configured" };
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/functions/v1/send-email`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({
        to: m.to, subject: m.subject, text: m.text, html: m.html,
        attachments: m.attachments?.map(a => ({ filename: a.filename, content: a.content.toString("base64"), contentType: a.contentType })),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const j = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!r.ok || !j.id) return { ok: false as const, error: (j.error ?? `send-email returned ${r.status}`).slice(0, 300) };
    return { ok: true as const, id: j.id };
  } catch (e) {
    return { ok: false as const, error: String(e).slice(0, 300) };
  }
}

// Shared dark-on-white-safe layout. Inline styles only, because mail clients ignore stylesheets.
export const shell = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="560" style="max-width:560px;background:#111;border:1px solid #292929;border-radius:14px;overflow:hidden"><tr><td style="background:#E50914;padding:14px 22px;font-weight:800;letter-spacing:2px">JAVS OF NAIROBI</td></tr><tr><td style="padding:22px"><h2 style="margin:0 0 12px">${esc(title)}</h2>${inner}</td></tr><tr><td style="padding:14px 22px;border-top:1px solid #292929;color:#A1A1A1;font-size:12px">TRAVEL. EXPERIENCE. CONNECT. · Nairobi, Kenya</td></tr></table></td></tr></table></body></html>`;
export const button = (href: string, label: string) => `<p><a href="${esc(href)}" style="display:inline-block;background:#E50914;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">${esc(label)}</a></p>`;
