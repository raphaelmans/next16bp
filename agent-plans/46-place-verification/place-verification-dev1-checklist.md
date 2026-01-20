# Place Verification - Dev 1 Checklist

**Focus Area:** Backend (DB + services + enforcement)  
**Modules:** 1A, 1B, 1C, 2A, 2B, 2C

---

## Module 1A: Place Verification Fields

- [ ] Add `place_verification_status` enum
- [ ] Add place columns: `verificationStatus`, `verifiedAt`, `verifiedByUserId`, `reservationsEnabled`, `reservationsEnabledAt`
- [ ] Add DB constraint preventing enabling reservations unless verified
- [ ] Backfill existing reservable places to verified + enabled

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
- [ ] Set place verification status to pending

## Module 2B: Admin APIs

- [ ] List pending
- [ ] Get detail
- [ ] Approve (updates place + request + event)
- [ ] Reject (updates place + request + event)

## Module 2C: Booking Enforcement

- [ ] Enforce gating in reservation creation paths
- [ ] Enforce gating in availability paths
- [ ] Ensure place detail exposes status/enabled fields

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `TZ=UTC pnpm build`
