# [00-37] Organization Payment Methods

> Date: 2026-01-13
> Previous: 00-36-place-photo-uploads.md

## Summary

Implemented organization-level payment methods and reservation policy defaults, removing place-level policy and wiring payment details into reservation flows and owner settings. Updated player payment UI and cancellation logic to rely on organization policy data.

## Changes Made

### Database & Schema

| File | Change |
| --- | --- |
| `src/shared/infra/db/schema/enums.ts` | Add payment method type/provider enums. |
| `src/shared/infra/db/schema/organization-payment.ts` | Add org reservation policy + payment method tables. |
| `src/shared/infra/db/schema/index.ts` | Export new schema file. |
| `drizzle/0002_organization_payment_methods.sql` | Add enums/tables, drop `reservable_place_policy`. |
| `src/shared/lib/payment-methods.ts` | Add PH provider constants + labels. |

### Backend

| File | Change |
| --- | --- |
| `src/modules/organization-payment/**` | New module for payment method CRUD + policy repository. |
| `src/shared/infra/trpc/root.ts` | Register `organizationPayment` router. |
| `src/modules/reservation/services/reservation.service.ts` | Use org policy for TTL/cancel cutoffs + add `getPaymentInfo`. |
| `src/modules/reservation/services/reservation-owner.service.ts` | Use org policy for payment hold TTL. |
| `src/modules/reservation/reservation.router.ts` | Add `getPaymentInfo` endpoint. |
| `src/modules/place/repositories/place.repository.ts` | Return org reservation policy for reservable places. |
| `src/modules/claim-request/use-cases/approve-claim-request.use-case.ts` | Remove place policy insert on claim approval. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Use org policy for cancellation cutoff display. |

### Frontend

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/settings/page.tsx` | Add payment methods UI with dialog + actions. |
| `src/features/owner/hooks/use-organization-payment-methods.ts` | Add tRPC hooks for payment methods. |
| `src/features/reservation/components/payment-info-card.tsx` | Render org methods with default badges. |
| `src/features/reservation/components/payment-method-card.tsx` | Switch to method type/provider enums. |
| `src/features/reservation/components/payment-instructions.tsx` | Render instructions per method. |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Fetch payment methods via `reservation.getPaymentInfo`. |

## Key Decisions

- Store payment methods and reservation policy defaults at the organization level to remove duplicated per-place configuration.
- Limit supported payment rails to PH mobile wallets and banks for consistency.
- Fetch payment info via reservation-scoped endpoint to enforce player access control.

## Next Steps (if applicable)

- [ ] Ensure organization policy row is created on organization creation/claim flows.
- [ ] Run `pnpm build` to validate end-to-end types.
- [ ] Confirm removal of legacy `place-policy` repository if no longer needed.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
