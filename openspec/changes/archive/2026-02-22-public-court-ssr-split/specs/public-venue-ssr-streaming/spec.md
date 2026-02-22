## ADDED Requirements

### Requirement: Public venue page SHALL server-render core place content
The public venue detail route SHALL render core place information (name, location, hero media, and primary metadata context) on the server before client hydration.

#### Scenario: Initial HTML contains place identity
- **WHEN** a user requests `/venues/[placeId]`
- **THEN** the first server response SHALL include core place information in HTML without requiring client-side place fetch completion

### Requirement: Public venue page SHALL stream secondary sections in parallel
The page SHALL render courts and venue detail sections in independent server suspense boundaries so each section can resolve and stream without blocking the other.

#### Scenario: Courts and venue details resolve independently
- **WHEN** courts data and venue details data have different response times
- **THEN** each section SHALL render as soon as its own data is ready while the other section can still show its fallback

### Requirement: Availability studio SHALL be client-only dynamic
The availability studio SHALL be loaded using dynamic client import with server rendering disabled.

#### Scenario: Availability studio is deferred
- **WHEN** the public venue page is server-rendered
- **THEN** availability studio code SHALL be excluded from server-rendered section output and loaded as a client-only dynamic component
