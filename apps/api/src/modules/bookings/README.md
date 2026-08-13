# Bookings module (scaffold)

Future ownership: appointment/slot booking flows from Architecture.md.

- Keep routes thin; put availability rules in `bookings.service.ts`
- Persist via Prisma models added later (`Booking`)
- Do not mount this router until the MVP feature ships

Extraction target: dedicated Booking service with its own DB/schema events.
