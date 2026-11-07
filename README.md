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
Also done: ticket emails with PDF attached (Supabase Edge Function), PDF ticket downloads, password reset by email, analytics dashboard with charts, homepage photo manager.
Not built yet: card/international payments (Flutterwave/Paystack/Pesapal), Redis (rate limits are in-memory), polls/events CMS, AI-written chat answers, social feeds, automated tests.

## Auth (Supabase)

Supabase Auth handles sign-up, login, sessions, password reset and staff invites. The `User` table stays as the app profile and is the only source of truth for `role` (never trust Supabase `user_metadata` for roles). `src/lib/session.ts` keeps the same `getSession` / `requireRole` / `STAFF` API, so admin pages and routes are unchanged.

Setup in the Supabase dashboard:

1. Project Settings > API: copy the URL, the anon key and the service_role key into `.env` (and Vercel). The service_role key is a server-only secret.
2. Authentication > URL Configuration: Site URL = your `APP_URL`; add Redirect URLs `https://your-domain/**` and `http://localhost:3000/**`.
3. Authentication > Providers > Email: keep "Confirm email" on, set minimum password length to 10.
4. Authentication > SMTP Settings: add your own SMTP (Supabase's built-in mailer allows only a few emails an hour). See the Email section (Resend SMTP).
5. Authentication > Email Templates: set the link in each template to:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/trips`
   - Invite user: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
6. `npx prisma migrate dev --name supabase_auth` (adds `User.authId`, drops `passwordHash` and `PasswordReset`).
7. Existing users: `npm run admin:migrate-users` links them to Supabase; they set a new password with Forgot password (old argon2 hashes cannot be moved).

Staff: `npm run admin:create` makes a Super Admin. A Super Admin manages the team at `/admin/staff` (invite by email, change roles, remove access). The same actions exist as `POST` and `PATCH /api/admin/staff`.

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

## Email (Supabase)
All email goes through your Supabase project. There is no SMTP config in the Next.js app.
- **Auth emails** (sign-up confirmation, staff invites, password reset) are sent by Supabase Auth. In Supabase: Authentication > SMTP Settings, add a custom SMTP provider (Resend works: host `smtp.resend.com`, port 465, user `resend`, password = your Resend API key), otherwise Supabase's built-in mailer is limited to a few emails an hour.
- **Ticket emails** (booking confirmation with the PDF attached) are sent by the `send-email` Edge Function in `supabase/functions/send-email`. Supabase has no generic "send any email" API, so the function delivers through Resend and keeps the key as a Supabase secret.
```bash
supabase login && supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="JAVS OF NAIROBI <tickets@your-domain>"
supabase functions deploy send-email --no-verify-jwt
```
Verify your sending domain in Resend (SPF and DKIM), otherwise tickets land in spam. The function only accepts requests carrying your service-role key, so it is not an open relay. Until it is deployed, nothing is sent: the notification is recorded as FAILED with the reason, `/api/cron/notify` retries it, and tickets stay on the booking page.
PDF tickets: `/api/tickets/:token/pdf` (token is the credential) and `/api/bookings/:id/pdf` (owner or staff). Only CONFIRMED bookings produce a PDF.

## Admin dashboard
`/admin` is the control room: revenue, bookings, new customers, seat occupancy and conversion with previous-period comparison, revenue and booking charts, booking outcomes, upcoming-trip seat meters, top trips and destinations, a "needs attention" queue and recent payments. `/admin/analytics` adds payment methods, average booking value, returning customers, news engagement and CSV exports. Every figure is computed from the database; 7, 30 and 90 day ranges, Nairobi time. Revenue figures are only shown to Super Admin, Administrator and Finance Manager roles on the dashboard.

## Homepage photo
`/admin/site` (Super Admin, Administrator, Content Editor): drag and drop photos, preview them behind the real headline, switch the live photo from the library, delete old ones, or go back to the automatic photo. Photos are shrunk to WebP in the browser, then uploaded straight to Supabase Storage with a one-time signed token (no 4.5 MB serverless limit).
Setup: create a **public** Storage bucket, set `SUPABASE_BUCKET` to its name. Uploads go to `site/hero-*.{jpg,png,webp}`.

## Admin screens
| Page | Who | What |
|---|---|---|
| `/admin` and `/admin/analytics` | all staff (money figures: Super Admin, Admin, Finance) | Live dashboard, charts, CSV |
| `/admin/manage` | by form | Create trips, articles, destinations, Nganya, gallery. Image fields upload straight to Supabase Storage (shrunk to WebP in the browser) or accept a pasted link |
| `/admin/events` | Super Admin, Admin, Booking Manager | Every event in one list: tick and publish/unpublish in bulk, pin up to 6 to the homepage, edit name, date, meeting point, photo and description, delete events with no bookings |
| `/admin/gallery` | Super Admin, Admin, Content Editor | Upload many photos at once, set category and caption, delete |
| `/admin/site` | Super Admin, Admin, Content Editor | Homepage photo library |
| `/admin/boarding` | Super Admin, Admin, Booking Manager, Support | Per-trip passenger list, "boarded X of Y", manual check-in and undo (auto-refreshes within 12 hours of departure) |
| `/admin/waitlist` | Super Admin, Admin, Booking Manager, Support | Who is waiting per trip, one-tap WhatsApp or email |
| `/admin/promos` | Super Admin, Admin, Finance | Create codes, turn on or off (codes are never deleted) |
| `/admin/staff` | Super Admin | Invite staff, change roles |
| `/admin/audit` | Super Admin, Admin | Searchable, paged log of who did what |

All uploads need the public Storage bucket from the Homepage photo section (`SUPABASE_BUCKET`).

## Support chat and WhatsApp button
A help-chat button and a WhatsApp button float on every public page (hidden in `/admin`). Set `NEXT_PUBLIC_WHATSAPP` (country code, no plus, e.g. `2547XXXXXXXX`) for the WhatsApp button and hand-offs.
The chat is free and uses no AI or API key. It matches the visitor's question against `src/lib/support-kb.ts` (the same list the Support page shows) and, when nothing matches, offers to continue on WhatsApp with a person. Edit that file to add policies, and only add what the business has confirmed (refund terms are still marked as to be confirmed). It cannot see bookings or payments, so it never claims a payment or booking outcome.
Messages are not stored. Rate limit is 12 per minute per IP, in memory like the other limiters, so move it to Redis before scaling out. An AI-written answer step could be added later behind the same route.
