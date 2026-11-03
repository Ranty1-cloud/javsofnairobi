# JAVS OF NAIROBI
Adventure travel, road trips and Nganya culture platform. Next.js 14 (App Router) + Prisma + PostgreSQL.

## Quick start
```bash
cp .env.example .env          # set DATABASE_URL, the 3 SUPABASE vars (see Auth), CRON_SECRET, APP_URL
npm install
npx prisma migrate dev --name supabase_auth
npm run db:seed               # sample data, clearly labelled "Sample"
npm run admin:create -- you@example.com 'a-long-password' 'Your Name'   # first Super Admin (Supabase login + SUPER_ADMIN role)
npm run dev
```
Before you push, run `npm run build` once and fix anything it reports. Fonts (Inter, Space Grotesk, Bebas Neue) are fetched from Google at build time.

## Status
Done: trips, atomic seat holds, M-Pesa STK + Paybill + C2B, tickets/QR/scanner, WhatsApp delivery, auth + roles, admin (trips, payments, refunds, promos, moderation, analytics/CSV), waitlist, reviews, loyalty points, Nganya showcase + moderated submissions, news, destinations, gallery lightbox, newsletter, sitemap/robots/JSON-LD, premium design system, 15-section homepage, trips filters/search/sort, 3-step booking flow.
Also done: ticket emails with PDF attached, PDF ticket downloads, password reset by email.
Not built yet: card/international payments (Flutterwave/Paystack/Pesapal), image upload (admin forms take image URLs), Redis (rate limits are in-memory), polls/events CMS, AI support assistant, social feeds, automated tests.

## Auth (Supabase)

Supabase Auth handles sign-up, login, sessions, password reset and staff invites. The `User` table stays as the app profile and is the only source of truth for `role` (never trust Supabase `user_metadata` for roles). `src/lib/session.ts` keeps the same `getSession` / `requireRole` / `STAFF` API, so admin pages and routes are unchanged.

Setup in the Supabase dashboard:

1. Project Settings > API: copy the URL, the anon key and the service_role key into `.env` (and Vercel). The service_role key is a server-only secret.
2. Authentication > URL Configuration: Site URL = your `APP_URL`; add Redirect URLs `https://your-domain/**` and `http://localhost:3000/**`.
3. Authentication > Providers > Email: keep "Confirm email" on, set minimum password length to 10.
4. Authentication > SMTP Settings: add your own SMTP (Supabase's built-in mailer allows only a few emails an hour). Reuse the SMTP values from the Email section.
5. Authentication > Email Templates: set the link in each template to:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/trips`
   - Invite user: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
6. `npx prisma migrate dev --name supabase_auth` (adds `User.authId`, drops `passwordHash` and `PasswordReset`).
7. Existing users: `npm run admin:migrate-users` links them to Supabase; they set a new password with Forgot password (old argon2 hashes cannot be moved).

Staff: `npm run admin:create` makes a Super Admin. A Super Admin can invite staff with `POST /api/admin/staff` `{email, name, role}` and change roles with `PATCH /api/admin/staff` `{email, role}`.

## Cron jobs (Authorization: Bearer $CRON_SECRET)
`/api/cron/expire` every minute · `/api/cron/notify` every 5 min (retries failed WhatsApp and email) · `/api/cron/reminders` hourly · `/api/cron/waitlist` every 5 min.

## Security notes
Prices, totals, seat availability and payment status are always computed server-side. Seats attached to a booking cannot be taken by another buyer. Payment confirmation is one atomic path (`lib/confirm.ts`); duplicate callbacks are no-ops; wrong-amount payments are left pending and logged for staff. `middleware.ts` gates /admin and /account; roles are re-checked against the DB on every request. Rate limits are per-instance until Redis is added.

## WhatsApp ticket delivery
1. In Meta Business, set up WhatsApp Cloud API and create a message template (category Utility, language `en`) named `ticket_confirmation`:
   `Hi {{1}}, your JAVS OF NAIROBI booking {{2}} for {{3}} is confirmed. Your tickets: {{4}}`
2. Fill the WHATSAPP_* and APP_URL variables in `.env`.
3. Point the webhook at `/api/whatsapp/webhook` (same verify token; subscribe to `messages`) so delivery status updates.
4. Schedule `GET /api/cron/notify` every few minutes with `Authorization: Bearer $CRON_SECRET` to retry failures.
Until credentials exist, sending is skipped and tickets remain available on the booking page.

### More WhatsApp templates (Utility, `en`)
- `trip_reminder`: `Hi {{1}}, reminder: {{2}} departs {{3}}. Meeting point: {{4}}.` Schedule `/api/cron/reminders` hourly.
- `trip_update`: `Hi {{1}}, an update for {{2}}: it now departs {{3}} from {{4}}.` Sent by `PATCH /api/admin/trips/:id` with `"notify": true`.

## Manual M-Pesa (Paybill) and C2B auto-confirm
Customers choose "Pay manually (Paybill)", pay MPESA_PAYBILL with their booking reference as the account number, and optionally enter the M-Pesa code. Seats stay held 2 hours.
- Manual: staff open `/admin/payments`, compare code and exact amount with the M-Pesa statement, then Confirm.
- Auto: register C2B URLs with Daraja (Register URL API) using `https://your-domain/api/payments/mpesa/c2b/confirmation?k=$MPESA_C2B_SECRET` and `.../c2b/validation`. Exact reference + exact amount matches confirm automatically; anything else is left in the audit log for staff.
- Waitlist template `seat_available`: `Seats have opened on {{1}}. Book now: {{2}}`. Schedule `/api/cron/waitlist`.

## Email (tickets)
Provider-neutral SMTP via nodemailer. Any provider that offers SMTP works (Resend, Brevo, Mailgun, Zoho, Google Workspace).
1. Set `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS or 465 TLS), `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` in `.env`.
2. Verify your sending domain with the provider (SPF and DKIM), otherwise tickets land in spam.
3. `npx prisma migrate dev --name email_pdf_password_reset` adds the `PasswordReset` table.
Until SMTP is set, nothing is sent: tickets stay on the booking page and password reset requests are only logged server-side.
PDF tickets: `/api/tickets/:token/pdf` (token is the credential) and `/api/bookings/:id/pdf` (owner or staff). Only CONFIRMED bookings produce a PDF.
