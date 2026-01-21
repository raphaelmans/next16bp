# Trust, Safety, And Quality Control

A staged supply pipeline (reduces platform risk)

- Curated places: discoverable, read-only, contact info visible, not bookable (immediate opt-out removal on request).
- Claiming: owners can claim curated places through an admin-reviewed workflow.
- Ownership verification: we validate phone + social links (and docs when needed) to prevent fake owners.
- Booking gate: bookings are enabled only after verification + owner enablement.

Privacy and enforcement

- Payment account details are never exposed via public endpoints.
- Payment methods are shown only in the reservation payment context.
- Booking is server-enforced: unverified or disabled places cannot be booked.

Liability posture

- No in-app payment processing.
- No in-app messaging.
- Clear expectations via reservation status + audit trail.
