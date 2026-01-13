# Developer 1 Checklist

**Focus Area:** Database + backend APIs + security + deprecation  
**Modules:** 1A, 2A, 2B, 5A

---

## Module 1A: Data Model + Migration

- [ ] Add `organization_reservation_policy` table with defaults.
- [ ] Add `organization_payment_method` table with constraints.
- [ ] Add provider/type enums (PH-only).
- [ ] Add “single default per org” invariant at DB level.
- [ ] Decide backfill approach (Option A vs B).

---

## Module 2A: Owner APIs

- [ ] `organizationPayment.method.list`
- [ ] `organizationPayment.method.create`
- [ ] `organizationPayment.method.update`
- [ ] `organizationPayment.method.delete`
- [ ] `organizationPayment.method.setDefault`
- [ ] Owner authorization checks.

---

## Module 2B: Player Reservation Payment Info

- [ ] `reservation.getPaymentInfo`
- [ ] Reservation ownership enforcement.
- [ ] Reservation status gating.

---

## Module 5A: Deprecation + Removal

- [ ] Remove `reservable_place_policy` inserts (place create / claim approve).
- [ ] Switch TTL reads to org policy defaults.
- [ ] Ensure public endpoints return no payment details.
- [ ] Drop legacy table (if appropriate).

---

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Manual sanity: owner CRUD + player payment page.
