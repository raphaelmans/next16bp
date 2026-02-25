## ADDED Requirements

### Requirement: Discovery venue detail SEO content SHALL be ISR-backed
Discovery venue detail pages SHALL use incremental static regeneration for public SEO-critical content with a one-hour revalidation interval.

#### Scenario: Public venue route uses ISR window
- **WHEN** `/venues/[placeId]` is requested after cache population
- **THEN** cached server-rendered content SHALL be served and revalidated on a 3600-second interval

## MODIFIED Requirements

### Requirement: Discovery venue detail rendering SHALL avoid client-first core data gating
The Discovery domain SHALL not require a client-side place query to render core venue detail content visible on first paint.

#### Scenario: Core venue content is visible without client place query completion
- **WHEN** JavaScript is delayed or hydration is slow
- **THEN** users SHALL still see core venue detail content from server-rendered HTML
