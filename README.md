# JAVS OF NAIROBI
Phase 1 scaffold: schema, atomic seat holds, brand hero.
Setup: `cp .env.example .env`, set DATABASE_URL, `npm i`, `npx prisma migrate dev`, `npm run dev`.
Next phases: trips and seat map UI, M-Pesa STK + webhook, auth, Nganya CMS, admin.

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
