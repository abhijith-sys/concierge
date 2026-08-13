# Payments module (scaffold)

Future ownership: deposits, booking charges, ad package purchases.

- Use `shared/integrations/payments.ts` adapter boundary
- Never store raw card data; rely on the gateway SDK + webhooks

Extraction target: Payments service + webhook worker.
