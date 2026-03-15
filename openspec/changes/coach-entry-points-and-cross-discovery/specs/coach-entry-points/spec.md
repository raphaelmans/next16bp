## ADDED Requirements

### Requirement: Public landing surfaces expose coach discovery entry points
The system SHALL expose coaches as a secondary audience from shared public landing surfaces without displacing court discovery as the primary call to action.

#### Scenario: Public navbar shows coach discovery
- **WHEN** a visitor views the public landing page on desktop or mobile
- **THEN** the shared public navbar SHALL include a persistent entry point to `/coaches`

#### Scenario: Landing helper CTA surfaces coach discovery
- **WHEN** a visitor views the landing hero support links or helper CTA area
- **THEN** the page SHALL provide a low-emphasis coach discovery CTA that links to public coach discovery

#### Scenario: Shared footer includes coach paths
- **WHEN** a visitor reaches the shared public footer
- **THEN** the footer SHALL include coach-focused navigation for browsing coaches and becoming a coach

### Requirement: Court discovery can pivot into coach discovery with shared context
The system SHALL let users pivot from court discovery into coach discovery while preserving only the search and location context that both experiences support.

#### Scenario: Court discovery header links to coaches
- **WHEN** a user views `/courts` on desktop or mobile
- **THEN** the results header SHALL include a secondary CTA that links to coach discovery

#### Scenario: Shared filters are preserved in coach pivot
- **WHEN** a user pivots from `/courts` to coach discovery
- **THEN** the resulting destination SHALL preserve only `q`, `province`, `city`, and `sportId`
- **AND** the destination SHALL NOT preserve court-only filters such as amenities, verification, date, or time

#### Scenario: Location routes map to equivalent coach routes
- **WHEN** a user pivots from a location-aware `/courts` route
- **THEN** the coach CTA SHALL prefer the equivalent `/coaches/locations/...` route when the current province, city, and sport context can be resolved

#### Scenario: Empty court results offer a coach alternative
- **WHEN** `/courts` returns no matching venues
- **THEN** the empty-results experience SHALL include a coach discovery alternative in addition to the default reset action

### Requirement: Signed-in surfaces expose coach re-entry shortcuts
The system SHALL expose coach-aware shortcuts on signed-in public surfaces by reusing the existing coach setup state.

#### Scenario: Signed-in user without coach profile sees coach onboarding shortcut
- **WHEN** an authenticated user without an existing coach profile views `/home` or public navbar auth actions
- **THEN** the system SHALL show a `Become a Coach` shortcut that links to `/coach/get-started`

#### Scenario: Signed-in coach sees coach portal shortcut
- **WHEN** an authenticated user with an existing coach profile views `/home` or public navbar auth actions
- **THEN** the system SHALL show a `Coach Portal` shortcut that links to `/coach/dashboard`

#### Scenario: Portal architecture remains unchanged
- **WHEN** signed-in coach shortcuts are added to public surfaces
- **THEN** the account default-portal and portal-switcher options SHALL remain limited to the existing player and organization choices
