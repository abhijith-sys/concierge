# Notifications module (scaffold)

Future ownership: email/SMS/push for bookings, reviews, messages.

- Use `shared/integrations/email.ts` and `shared/integrations/sms.ts`
- Prefer outbox/queue when volume grows

Extraction target: Notification worker service.
