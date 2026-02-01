# Notification State Machine - Changelog

This changelog tracks contract changes to the notification delivery system.

## 2026-02-01 - Email + SMS outbox (admin verification notifications)

### Why
- Admins needed immediate visibility when owners submit verification requests.
- Delivery must not block owner workflows and should be retryable.

### Changes
- Added outbox jobs (`notification_delivery_job`).
- Added cron dispatcher for delivery.
- Integrated Resend (email) and Semaphore (sms).
- Implemented admin notifications for `place_verification.requested`.
