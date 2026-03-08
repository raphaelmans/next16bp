## ADDED Requirements

### Requirement: Admin can view venue reviews for moderation
The system SHALL provide admins with a moderation view of venue reviews, including reviewer identity, venue identity, rating, review text, status, and timestamps.

#### Scenario: Admin loads moderation list
- **WHEN** an admin opens the venue review moderation page
- **THEN** the system SHALL return venue reviews with enough metadata to identify the reviewer, venue, rating, current status, and moderation history

#### Scenario: Admin filters moderation list
- **WHEN** an admin filters the moderation list by status, rating, venue, or reviewer
- **THEN** the system SHALL return only reviews matching the selected filters

### Requirement: Admin can remove any venue review
The system SHALL allow an admin to remove any active venue review regardless of authorship.

#### Scenario: Admin removes review
- **WHEN** an admin removes an active venue review
- **THEN** the review SHALL no longer appear on public surfaces, the removal metadata SHALL record the admin action, and venue aggregates SHALL be recalculated without that review

#### Scenario: Admin removes already removed review
- **WHEN** an admin attempts to remove a review that is already removed
- **THEN** the system SHALL reject the action as non-reviewable or treat it as a no-op without creating duplicate removal state

### Requirement: Admin moderation preserves review auditability
The system SHALL preserve moderation history for removed reviews so the platform can audit who removed a review and when.

#### Scenario: Removed review remains visible in moderation history
- **WHEN** an admin views a review that has been removed
- **THEN** the moderation surface SHALL show the removal status and associated removal metadata instead of permanently erasing the record

### Requirement: Review author and admin are the only removal actors
The system SHALL limit review removal rights to the review author and admins.

#### Scenario: Non-author non-admin removal is blocked
- **WHEN** an authenticated user who is neither the review author nor an admin attempts to remove a venue review
- **THEN** the system SHALL reject the request as unauthorized

#### Scenario: Author and admin removal coexist
- **WHEN** a venue review is displayed in public or moderation surfaces
- **THEN** the review author SHALL be able to remove their own review and admins SHALL be able to remove that same review through moderation tooling
