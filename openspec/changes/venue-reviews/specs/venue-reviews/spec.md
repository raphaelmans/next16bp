## ADDED Requirements

### Requirement: Authenticated user can create or update one venue review
The system SHALL allow any authenticated user to create or update exactly one active review per venue. Each review SHALL include a 1-5 star rating and MAY include written review text.

#### Scenario: Authenticated user submits a first review
- **WHEN** an authenticated user submits a 1-5 star rating for a venue they have not reviewed before
- **THEN** the system SHALL create a new active review for that `(placeId, userId)` pair and publish it immediately

#### Scenario: Authenticated user updates an existing review
- **WHEN** an authenticated user submits a review for a venue they have already reviewed
- **THEN** the system SHALL update the existing active review instead of creating a duplicate review

#### Scenario: Unauthenticated user attempts to submit a review
- **WHEN** an unauthenticated visitor attempts to create or update a venue review
- **THEN** the system SHALL reject the write request and require authentication

### Requirement: Venue reviews apply to curated and organization-owned venues
The system SHALL support reviews for both curated venues and organization-owned reservable venues using the same venue identity.

#### Scenario: User reviews a curated venue
- **WHEN** an authenticated user submits a review for a curated venue
- **THEN** the system SHALL store the review against that venue's `placeId`

#### Scenario: User reviews an organization-owned venue
- **WHEN** an authenticated user submits a review for a reservable venue owned by an organization
- **THEN** the system SHALL store the review against that venue's `placeId`

### Requirement: Review history survives venue ownership changes
The system SHALL preserve venue reviews when a venue is claimed, transferred to another organization, or returned to curated because the canonical venue identity remains the same `placeId`.

#### Scenario: Curated venue is claimed by an organization
- **WHEN** a curated venue with existing reviews is approved for claim and becomes reservable
- **THEN** the existing reviews and aggregate rating SHALL remain attached to the same venue and remain publicly visible

#### Scenario: Venue is returned to curated
- **WHEN** an owned venue with existing reviews is returned to curated
- **THEN** the existing reviews and aggregate rating SHALL remain attached to the same venue and remain publicly visible

### Requirement: Public venue surfaces show review summary
The system SHALL expose venue review summary data on public venue browsing surfaces, including the shared place-card UI and the shared public venue detail page.

#### Scenario: Place card shows aggregate summary
- **WHEN** a venue has at least one active public review and is rendered through the shared place-card UI
- **THEN** the card SHALL display the venue's average rating and active review count

#### Scenario: Venue without reviews shows no misleading rating
- **WHEN** a venue has no active public reviews
- **THEN** public venue cards and venue detail summary surfaces SHALL omit the aggregate rating display rather than showing a fabricated zero-rating state

### Requirement: Public venue detail page shows review summary and list
The system SHALL show a venue review section on the shared public venue detail experience with aggregate summary, rating distribution, and a list of active public reviews.

#### Scenario: Venue detail shows review section
- **WHEN** a visitor opens a venue detail page for a venue with active reviews
- **THEN** the page SHALL show the average rating, total review count, per-star distribution, and a list of active reviews for that venue

#### Scenario: Venue detail shows empty review state
- **WHEN** a visitor opens a venue detail page for a venue with no active reviews
- **THEN** the page SHALL show an empty review state that invites authenticated users to write the first review

### Requirement: Authenticated user can remove their own review
The system SHALL allow a review author to remove their own active review.

#### Scenario: Review author removes review
- **WHEN** the author of an active venue review removes their review
- **THEN** the review SHALL no longer appear on public surfaces and the venue aggregates SHALL be recalculated without it

#### Scenario: Different authenticated user attempts review removal
- **WHEN** an authenticated user attempts to remove another user's active review
- **THEN** the system SHALL reject the request as unauthorized

### Requirement: Review aggregates exclude removed reviews
The system SHALL calculate average rating, review count, and rating distribution using only active public reviews.

#### Scenario: Removed review no longer counts
- **WHEN** an active venue review is removed by its author or an admin
- **THEN** that review SHALL be excluded from all public aggregate calculations and public review lists

### Requirement: Public venue structured data can include aggregate rating
The system SHALL expose aggregate rating structured data for venue pages only when at least one active review exists.

#### Scenario: Structured data includes rating
- **WHEN** a venue detail page is rendered for a venue with one or more active reviews
- **THEN** the page structured data SHALL include aggregate rating values derived from active public reviews

#### Scenario: Structured data omits empty rating
- **WHEN** a venue detail page is rendered for a venue with zero active reviews
- **THEN** the page structured data SHALL omit aggregate rating fields
