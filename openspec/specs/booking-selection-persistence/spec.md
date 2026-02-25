## Purpose

Recover booking context after authentication by using a short-lived, court-scoped localStorage backup when URL params are missing.

## Requirements

### Requirement: Booking page SHALL restore start time from pending booking backup
The booking flow SHALL seed missing `startTime` from `kudos:pending-booking` when the backup is valid and court-matched.

#### Scenario: Restore from localStorage when `startTime` is absent
- **GIVEN** booking page `startTime` param is absent
- **AND** `kudos:pending-booking` has a non-expired entry matching current `courtId`
- **WHEN** pending booking state is read
- **THEN** booking params are seeded with stored `startTime`

### Requirement: Expired or mismatched backup entries SHALL be ignored
Pending booking entries SHALL only be used when not expired and when `courtId` matches the current page.

#### Scenario: Expired entry ignored
- **WHEN** stored `expires` is earlier than `Date.now()`
- **THEN** the pending booking value resolves to null and no seeding occurs

#### Scenario: Mismatched court ignored
- **WHEN** stored `courtId` does not match current page `courtId`
- **THEN** the pending booking value resolves to null

### Requirement: Pending booking backup SHALL clear after successful reservation
After reservation creation succeeds, pending booking fallback data SHALL be removed.

#### Scenario: Cleared after booking creation
- **WHEN** reservation creation succeeds
- **THEN** `clearPendingBooking()` is called before navigation

### Requirement: Storage access SHALL be client-guarded
The implementation SHALL avoid direct localStorage access on server render paths.

#### Scenario: Server-side safety
- **WHEN** booking page code runs in a server context
- **THEN** localStorage access is guarded by a browser check (for example `typeof window !== "undefined"`)
