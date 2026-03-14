# Step 2: Coach Payment Methods Backend + Payment-Info Resolution

## Understanding

The `coach_payment_method` table exists in schema with the same shape as `organization_payment_method`.
Setup-status already queries it to check payment readiness. But there's no CRUD module.

The reservation service's `getPaymentInfo` currently returns empty `{ methods: [], defaultMethodId: null }` for coach reservations (line 2032-2033).

## Plan

1. Create `src/lib/modules/coach-payment/` module following org-payment pattern:
   - `errors/coach-payment.errors.ts` - NotFound, Conflict, Inactive errors
   - `dtos/coach-payment-method.dto.ts` - List/Create/Update/Delete/SetDefault schemas
   - `dtos/index.ts` - barrel export
   - `repositories/coach-payment-method.repository.ts` - CRUD with tx support
   - `services/coach-payment.service.ts` - business logic with authorization
   - `factories/coach-payment.factory.ts` - singleton factory
   - `coach-payment.router.ts` - tRPC router with 5 endpoints

2. Register `coachPaymentRouter` in tRPC root router.

3. Extend `ReservationService.getPaymentInfo()` to resolve coach payment methods when `reservation.coachId` is set.
   - Add `ICoachPaymentMethodRepository` as a new constructor dependency
   - Update factory to inject it

4. Run lint to validate.

## Key Decisions
- Follow exact same patterns as organization-payment module
- Coach authorization uses `requireOwnedCoach` helper from coach module
- `ReservationPaymentMethod` type is already compatible (same fields)
- The `type` field uses the same `OrganizationPaymentMethodRecord["type"]` reference - this is fine since it's the same DB enum

## Completed

All three tasks done in a single iteration:
1. Created full `coach-payment` module with 7 files (errors, DTOs, repository, service, factory, router)
2. Extended `ReservationService.getPaymentInfo()` to resolve coach payment methods for coach reservations
3. Registered `coachPayment` router in tRPC root
4. Lint passes on all touched files
5. Committed as `16d2324a6`
