## 1. Backend Booking Policy

- [ ] 1.1 Relax reservation creation guards so non-verified venues can be booked when the place is reservable and reservations are enabled.
- [ ] 1.2 Update owner reservation toggle logic to allow enabling reservations for `UNVERIFIED`, `PENDING`, and `REJECTED` venues while preserving the active payment-method requirement.
- [ ] 1.3 Add upsert-based handling for venues that have no existing `place_verification` row when reservations are toggled.
- [ ] 1.4 Update admin verification rejection flow to preserve the existing reservation toggle state instead of forcing reservations off.

## 2. Shared Enablement And Messaging

- [ ] 2.1 Update shared reservation enablement helpers so public booking visibility no longer depends on `status === "VERIFIED"`.
- [ ] 2.2 Update shared verification-display messaging so non-verified venues show warning-state copy while remaining bookable.
- [ ] 2.3 Update owner-facing verification copy that still describes verification as unlocking reservations.

## 3. Player Booking Surfaces

- [ ] 3.1 Update public place-detail booking surfaces to keep booking UI available for non-verified venues and show warning banners there.
- [ ] 3.2 Update direct court booking surfaces to keep booking UI available for non-verified venues and show warning banners there.
- [ ] 3.3 Update direct booking or checkout pages to remove verified-only fallback lockouts and show warning banners instead.
- [ ] 3.4 Verify that non-booking public venue surfaces do not gain new verification warning banners.

## 4. Regression Coverage

- [ ] 4.1 Add service tests covering booking eligibility for `UNVERIFIED`, `PENDING`, and `REJECTED` venues plus the unchanged payment-method requirement.
- [ ] 4.2 Add service tests covering verification-row upsert behavior during reservation toggles and reservation-state preservation on admin rejection.
- [ ] 4.3 Add shared-helper tests covering booking visibility and warning-state messaging for verified and non-verified venues.
- [ ] 4.4 Add UI or integration coverage for place-detail, court-detail, and direct booking flows to confirm warning visibility without booking lockout.
