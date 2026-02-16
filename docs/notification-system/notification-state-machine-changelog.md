# Notification State Machine - Changelog

This changelog tracks contract changes to the notification delivery system.

## 2026-02-16 - Workshop docs re-review (all business notification types)

### Why
- Workshop presentation needs one accurate, non-engineering-friendly view of all current notification types.
- Existing docs had drift between code and event/recipient/ops wording.

### Changes
- Added unified event catalog for all current business notification types.
- Updated overview and state-machine docs to link to the canonical catalog.
- Aligned docs with current recipient coverage (admins, owners, players by event type).
- Clarified enqueue behavior (transaction-coupled vs best-effort paths in some reservation lifecycle flows).
- Updated ASCII and ops wording for channel and runtime accuracy.

## 2026-02-01 - Email + SMS outbox (admin verification notifications)

### Why
- Admins needed immediate visibility when owners submit verification requests.
- Delivery must not block owner workflows and should be retryable.

### Changes
- Added outbox jobs (`notification_delivery_job`).
- Added cron dispatcher for delivery.
- Integrated Resend (email) and Semaphore (sms).
- Implemented admin notifications for `place_verification.requested`.

## 2026-02-01 - Owner notifications (reservations + verification decisions)

### Why
- Owners need immediate visibility for new reservations.
- Owners should be notified when their verification or claim requests are approved or rejected.

### Changes
- Implemented owner notifications for `reservation.created`.
- Implemented owner notifications for `place_verification.approved|rejected`.
- Implemented owner notifications for `claim_request.approved|rejected`.
