## ADDED Requirements

### Requirement: Reservation Reads SHALL Use Canonical Query Layers
The system SHALL expose reservation reads through canonical query layers keyed by `reservationId` and stable scope inputs rather than through broad consumer-specific data fetches. At minimum, the reservation domain SHALL support summary list reads, entity detail reads, linked detail reads, and projection/count reads as distinct cacheable concerns.

#### Scenario: Summary rows use stable scope keys
- **WHEN** an owner or player reservation list is rendered
- **THEN** the UI MUST read from a summary-list query keyed by a stable serialized scope
- **AND** the query MUST return enough data to render standard rows without requiring eager entity-detail requests for every row

#### Scenario: Entity detail is canonical across surfaces
- **WHEN** a reservation detail page, action dialog, expanded row, or chat header requests full reservation data for the same `reservationId`
- **THEN** those surfaces MUST reuse the same canonical entity-detail query key
- **AND** the system MUST not define separate consumer-specific entity caches for the same reservation

#### Scenario: Linked reservations remain reservation-first
- **WHEN** a surface needs grouped or linked reservation context
- **THEN** it MUST request linked detail using `reservationId`
- **AND** any legacy `reservationGroupId` input MUST be resolved to `reservationId` at the boundary before linked detail is read

### Requirement: Reservation Lifecycle Sync SHALL Be Scoped
The system SHALL translate realtime reservation lifecycle events into scoped cache patching and invalidation rather than broad reservation-domain refetching.

#### Scenario: Lifecycle change updates affected reservation caches
- **WHEN** a realtime reservation lifecycle event is received for a reservation
- **THEN** the system MUST update or invalidate the canonical entity-detail cache for that `reservationId`
- **AND** it MUST invalidate any linked-detail, summary-list, count, or projection caches whose scope includes that reservation
- **AND** it MUST avoid invalidating unrelated reservation scopes

#### Scenario: Count and projection queries converge with lists
- **WHEN** a reservation status changes in a way that affects owner counts, alerts, or dashboard projections
- **THEN** the affected count and projection queries MUST converge to the same reservation state as the reservation summary and entity queries

#### Scenario: Reservation-linked chat context follows canonical reservation identity
- **WHEN** a reservation lifecycle event changes a reservation shown in chat-linked UI
- **THEN** the chat-linked reservation context MUST resynchronize using the canonical reservation query identity for that `reservationId`

### Requirement: Navigation SHALL Reuse Reservation Cache Entries
The system SHALL reuse canonical reservation cache entries across page transitions and shared UI surfaces so that navigation does not trigger redundant broad refetching for the same active reservation data.

#### Scenario: Page switch reuses fresh entity data
- **WHEN** a user navigates from a reservation list surface to a reservation detail surface for a reservation whose entity-detail query is already fresh in cache
- **THEN** the detail surface MUST reuse the cached entity data
- **AND** it MUST not trigger a broad reservation list refetch solely because the page changed

#### Scenario: Shared summary data survives surface changes
- **WHEN** a user switches between reservation surfaces that consume the same summary-list scope
- **THEN** the surfaces MUST reuse the same cached summary query data subject to cache freshness rules
- **AND** synchronization MUST continue to be driven by scoped lifecycle events rather than page boundaries
