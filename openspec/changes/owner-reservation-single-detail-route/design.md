## Context

Owner grouped reservations are already operationally processed as a single decision unit via `reservationGroupId` in owner mutations. However, navigation and notification links still split across single-reservation detail and a dedicated owner group-detail page, resulting in inconsistent user journeys and duplicated page responsibilities.

## Goals / Non-Goals

**Goals:**
- Enforce one canonical owner detail destination for grouped bookings.
- Preserve backwards compatibility for previously issued group-detail links.
- Keep existing group-wide mutation semantics unchanged.
- Align grouped owner notification links with the canonical destination.

**Non-Goals:**
- Reworking player-side grouped routing.
- Redesigning owner reservation action semantics or permissions.
- Changing reservation/group persistence or payload schemas.

## Decisions

### 1) Canonical owner grouped detail URL is single-reservation detail
- Decision: Grouped owner entrypoints SHALL route to `/organization/reservations/:representativeReservationId`.
- Rationale: This minimizes cognitive overhead and consolidates operational actions into one stable surface.
- Alternative considered: Keep dedicated group page as primary route. Rejected due to duplicate destination behavior and discoverability inconsistency.

### 2) Legacy group route remains as compatibility redirect
- Decision: `/organization/reservations/group/:groupId` stays available and performs server-side redirect to the representative reservation detail route.
- Rationale: Preserves old notification links, bookmarks, and shared URLs.
- Alternative considered: Remove route and return not-found. Rejected because it would break existing links.

### 3) Grouped owner notifications use representative reservation links
- Decision: Owner grouped lifecycle notifications (created, payment_marked, cancelled) SHALL link to `appRoutes.organization.reservationDetail(payload.representativeReservationId)`.
- Rationale: Keeps notifications consistent with canonical owner navigation.
- Alternative considered: Keep group notification URLs unchanged. Rejected due to continued split destinations.

### 4) Group-aware operations remain unchanged
- Decision: Existing owner actions continue passing `reservationGroupId` where available and rely on current service/router behavior.
- Rationale: Routing consistency is the change target; group mutation semantics already satisfy business requirements.

## Risks / Trade-offs

- [Risk] Redirect route cannot resolve representative reservation for a stale/invalid groupId → Mitigation: fallback to not-found behavior with clear recovery path.
- [Risk] Mixed links from unmodified corners cause temporary inconsistency → Mitigation: repository-wide replacement audit for owner grouped links in this change.
- [Trade-off] Dedicated group-only owner page becomes non-canonical and effectively transitional → Mitigation: retain compatibility redirect to avoid abrupt breakage.

## Migration Plan

1. Deploy canonical-link changes for grouped owner notifications.
2. Deploy redirect behavior for legacy group route.
3. Remove explicit UI links to legacy group page.
4. Verify manual smoke matrix for tables, alerts, notifications, and direct legacy URLs.

Rollback strategy:
- Revert redirect page and notification URL changes together to restore previous group-page links.

## Open Questions

- None. Product decision is fixed: owner grouped reservations use only the single detail page.
