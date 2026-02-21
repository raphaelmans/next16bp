## ADDED Requirements

### Requirement: Booking review SHALL show add-on-aware price breakdown
Booking summary surfaces SHALL show transparent totals that distinguish base booking cost and add-on contribution.

#### Scenario: Booking summary with add-ons
- **WHEN** selected or auto-applied add-ons affect total pricing
- **THEN** the booking summary displays base amount, add-on amount, and final total consistently

### Requirement: Pricing warnings SHALL be rendered as non-blocking guidance
Pricing warnings returned by backend evaluation (for example partial auto coverage) SHALL be shown in booking/review UI as contextual non-blocking alerts.

#### Scenario: Backend returns pricing warnings
- **WHEN** booking pricing response includes warnings
- **THEN** the UI renders warning copy near pricing details and still allows booking confirmation when no hard error is present

### Requirement: Warning and breakdown UX SHALL remain accessible and mobile-safe
Warning and breakdown components SHALL preserve readable hierarchy, keyboard accessibility, and responsive layout behavior across desktop and mobile booking surfaces.

#### Scenario: Player reviews warnings on mobile
- **WHEN** the player opens booking review on a narrow viewport
- **THEN** warning and breakdown content remain fully readable, non-overlapping, and actionable without horizontal scrolling
