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
