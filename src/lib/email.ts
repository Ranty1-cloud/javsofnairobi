import nodemailer, { type Transporter } from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
// Provider-neutral SMTP (Resend, Brevo, Mailgun, Zoho, Google Workspace and so on all offer SMTP).
// If SMTP_HOST / EMAIL_FROM are not set, nothing is sent and callers get "not_configured". We never pretend a mail went out.
let tx: Transporter | null = null;
export const emailConfigured = () => !!(process.env.SMTP_HOST && process.env.EMAIL_FROM);
export const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export async function sendMail(m: { to: string; subject: string; text: string; html: string; attachments?: Attachment[] }) {
  if (!emailConfigured()) return { ok: false as const, error: "not_configured" };
  const { SMTP_HOST: host, SMTP_PORT, SMTP_USER: user, SMTP_PASS: pass, EMAIL_FROM: from } = process.env;
  const port = Number(SMTP_PORT ?? 587);
  tx ??= nodemailer.createTransport({ host, port, secure: port === 465, auth: user ? { user, pass } : undefined });
  try {
    const r = await tx.sendMail({ from, ...m });
    return { ok: true as const, id: r.messageId as string };
  } catch (e) {
    return { ok: false as const, error: String(e).slice(0, 300) };
  }
}
// Shared dark-on-white-safe layout. Inline styles only, because mail clients ignore stylesheets.
export const shell = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="560" style="max-width:560px;background:#111;border:1px solid #292929;border-radius:14px;overflow:hidden"><tr><td style="background:#E50914;padding:14px 22px;font-weight:800;letter-spacing:2px">JAVS OF NAIROBI</td></tr><tr><td style="padding:22px"><h2 style="margin:0 0 12px">${esc(title)}</h2>${inner}</td></tr><tr><td style="padding:14px 22px;border-top:1px solid #292929;color:#A1A1A1;font-size:12px">TRAVEL. EXPERIENCE. CONNECT. · Nairobi, Kenya</td></tr></table></td></tr></table></body></html>`;
export const button = (href: string, label: string) => `<p><a href="${esc(href)}" style="display:inline-block;background:#E50914;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">${esc(label)}</a></p>`;
