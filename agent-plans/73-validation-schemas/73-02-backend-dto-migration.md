# Phase 2 - Backend DTO Migration

## Goal

Migrate all module DTO schemas to shared primitives and Zod v4 style, then replace inline router schemas with DTOs where practical.

---

## Shared / Contract

- [ ] Ensure DTOs import from `src/shared/kernel/schemas.ts`.
- [ ] Keep error messages sourced from `validationDatabase`.

---

## Server / Backend

- [ ] Migrate DTOs in `src/modules/**/dtos/*.dto.ts` to shared primitives.
- [ ] Replace inline router inputs with DTO schemas:
  - `src/modules/organization/organization.router.ts`
  - `src/modules/reservation/reservation.router.ts`
  - `src/modules/profile/profile.router.ts`
  - `src/app/api/public/track/route.ts` (if treated as API schema)
- [ ] Update Zod format validators:
  - `.email()` -> `.check(z.email({ error: ... }))`
  - `.url()` -> `.check(z.url({ error: ... }))`
  - `.uuid()` -> `.check(z.uuid({ error: ... }))`
  - `.datetime()` -> `.check(z.iso.datetime({ error: ... }))`

### High-Touch Modules

- Auth (`src/modules/auth/dtos/*`)
- Organization (`src/modules/organization/dtos/*`)
- Place/Court (`src/modules/place/dtos/*`, `src/modules/court/dtos/*`)
- Claim Request (`src/modules/claim-request/dtos/*`)
- Reservation (`src/modules/reservation/dtos/*`)
- Payment Proof (`src/modules/payment-proof/dtos/*`)
- Availability (`src/modules/availability/dtos/*`)
- Bookings Import (`src/modules/bookings-import/dtos/*`)
- Contact (`src/modules/contact/dtos/*`)

---

## Client / Frontend

- [ ] No client changes in this phase.

---

## Implementation Notes

- Keep DTO field names unchanged to avoid API contract churn.
- For optional fields, continue using `optional()`/`nullish()`; form overrides handle empty string acceptance.
- Where DTO schemas currently accept coordinates as strings, keep that for API consistency; define a shared coordinate helper.
