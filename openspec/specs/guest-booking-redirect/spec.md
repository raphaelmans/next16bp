## Purpose

Preserve full booking context (court and slot) across guest authentication redirects so users return directly to their selected booking flow.

## Requirements

### Requirement: Guest booking redirect SHALL use full booking URL
When an unauthenticated guest has selected a slot and initiates reserve, the redirect target SHALL include both `courtId` and `slotId`.

#### Scenario: Full booking URL in redirect param
- **WHEN** a guest has selected a time slot on `BookingCard` and clicks "Sign in to reserve"
- **THEN** the redirect target is `/courts/{courtId}/book/{slotId}`
- **AND** the login URL is `/login?redirect=%2Fcourts%2F{courtId}%2Fbook%2F{slotId}`
- **AND** the redirect value is URL-encoded once (no double encoding)

### Requirement: Auth callback SHALL allow booking redirect routes
Safe redirect validation SHALL permit booking routes used by guest booking redirect.

#### Scenario: Redirect survives auth callback
- **WHEN** `getSafeRedirectPath()` processes `/courts/{id}/book/{slotId}` with `disallowRoutes: ["guest"]`
- **THEN** the route is allowed as a booking route
- **AND** auth callback redirects the user to `/courts/{id}/book/{slotId}`

### Requirement: Pending booking backup SHALL be stored before redirect
The client SHALL write a short-lived local backup before starting auth redirect.

#### Scenario: localStorage backup written before redirect
- **WHEN** a guest clicks "Sign in to reserve"
- **THEN** localStorage key `kudos:pending-booking` is written
- **AND** it contains `{ courtId, slotId, startTime, expires }`
- **AND** `expires` equals `Date.now() + 30 * 60 * 1000` (30 minutes)

### Requirement: No selected slot SHALL not trigger redirect side effects
If the user has not selected a slot, redirect and backup write behavior SHALL not run.

#### Scenario: Unauthenticated without slot
- **WHEN** no slot is selected and the "Select a time slot" state is shown
- **THEN** no redirect or localStorage write occurs
