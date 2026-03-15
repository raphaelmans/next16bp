# Place Verification - Dev 1 Checklist

**Focus Area:** Backend (DB + services + enforcement)  
**Modules:** 1A, 1B, 1C, 2A, 2B, 2C

---

## Module 1A: Place Verification Gate Table

- [ ] Add `place_verification_status` enum
- [ ] Create `place_verification` 1:1 table (PK = place_id)
- [ ] Add DB constraint preventing enabling reservations unless verified
- [ ] Create `place_verification` rows for all existing places with UNVERIFIED + reservations disabled

## Module 1B: Verification Request Tables

- [ ] Create `place_verification_request`
- [ ] Create `place_verification_request_event`
- [ ] Create `place_verification_request_document`
- [ ] Add unique pending constraint per place
- [ ] Add supporting indexes

## Module 1C: Storage Bucket

- [ ] Add `place-verification-docs` bucket seed
- [ ] Add bucket constant in `STORAGE_BUCKETS`

## Module 2A: Owner APIs

- [ ] Implement submit request (ownership check)
- [ ] Upload docs + persist document rows
- [ ] Upsert `place_verification` and set status to PENDING

## Module 2B: Admin APIs

- [ ] List pending
- [ ] Get detail
- [ ] Approve (updates place_verification + request + event)
- [ ] Reject (updates place_verification + request + event)

## Module 2C: Booking Enforcement

- [ ] Enforce gating in reservation creation paths
- [ ] Enforce gating in availability paths
- [ ] Ensure place detail exposes status/enabled fields

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `TZ=UTC pnpm build`
