## Context

The app already treats `reservationId` as the canonical player-facing identifier, including for linked reservations, but the player UI is still split into a detail route and a payment route. The booking page decides which route to use, the payment page refetches reservation detail and linked detail, and player CTAs still point to `/reservations/[id]/payment` for payable reservations.

This creates duplicated fetches, unnecessary navigation, and more failure points during a time-sensitive interaction. The product direction is speed and reliability, so the player needs one canonical reservation page that can render the right state immediately, stay in sync through realtime changes, and avoid route hops during payment completion.

This change is intentionally narrow. It only consolidates the player reservation experience under one route and does not redesign owner flows, payment infrastructure, or reservation lifecycle semantics.

## Goals / Non-Goals

**Goals:**
- Make `/reservations/[id]` the only player reservation route.
- Support both overview and payment states from that route.
- Use `nuqs` only for URL/UI step state and React Query only for server state.
- Support linked/group payment on the same canonical page.
- Keep navigation and cache behavior fast by reusing canonical reservation queries.
- Keep the player reservation page visually consistent across loading, overview, payment, and terminal states with minimal layout shift.
- Enforce player ownership on reservation detail reads.

**Non-Goals:**
- Introduce new payment backend contracts.
- Redesign owner reservation flows.
- Keep a long-term compatibility route for `/reservations/[id]/payment`.
- Replace the current reservation-first linked reservation model.
- Refactor unrelated booking or reservation UI outside the player canonical-page flow.

## Decisions

### 1. Use one canonical player reservation route
`/reservations/[id]` becomes the only player reservation route. `/reservations/[id]/payment` is removed in the same cut.

This matches the hard-cutover product decision and avoids carrying dual-route semantics through booking success navigation, CTA generation, login redirect behavior, and player notifications.

Alternatives considered:
- Keep `/payment` as a compatibility redirect: rejected because the decision is immediate removal.
- Keep both routes with a shared shell: rejected because it preserves split-route behavior and duplicated route logic.

### 2. Represent payment as URL step state
The reservation page will use a typed step model, `overview | payment`, driven by `?step=payment` through `nuqs`.

`nuqs` owns only the URL/UI step. Reservation entity state remains in React Query and is derived from canonical reservation queries.

Alternatives considered:
- Local component state only: rejected because CTA deep-linking and back/forward behavior matter.
- Store reservation entity state in `nuqs`: rejected because entity state belongs in server-state infrastructure.

### 3. Derive the effective step from reservation status
The page accepts an explicit `?step=payment`, but only payable states remain on that step. Invalid combinations normalize to the correct canonical view using replacement navigation.

Rules:
- No `step` param defaults to `payment` when payment is still required, otherwise `overview`
- `step=payment` remains valid only while the reservation still requires player payment
- non-payable, expired, cancelled, or confirmed reservations normalize away from payment UI
- linked/group reservations with payable items render group payment inline on the same page

Alternatives considered:
- Honor all explicit steps regardless of status: rejected because it leaves stale or broken payment UI accessible.
- Always default to overview and open payment in a modal: rejected because addressable URL state is better for recovery and linking.

### 4. Keep one canonical player page shell
The player reservation feature should own one canonical page shell that composes:
- reservation detail query
- linked detail query
- conditional payment info query
- step resolution
- realtime subscription
- refresh behavior
- inline payment submission flow

This keeps status-driven orchestration in one place and avoids splitting route ownership across separate page implementations.

The shell should keep the same high-level structure across states:
- stable page header and primary content grid
- stable sidebar/action area placement
- loading skeletons sized to the final layout
- inline payment content that replaces the main content area without shifting the surrounding shell
- status transitions that update content in place instead of remounting unrelated layout sections

Alternatives considered:
- Keep separate top-level detail and payment pages: rejected because that keeps the current split alive.
- Move all orchestration to route files: rejected because route files should stay thin.

### 5. Reuse existing payment mutations and remove payment-route navigation
Existing payment proof upload and mark-payment mutations remain valid. Only navigation and page composition change:
- booking success navigates directly to `/reservations/[id]` with optional `?step=payment`
- payment success stays on the same route and replaces the step back to overview
- warmup/prefetch targets canonical reservation page queries instead of a separate payment route

Alternatives considered:
- Create a new combined payment mutation: rejected because current contracts already support the required behavior.
- Keep pushing between routes after payment: rejected because the canonical route already contains both views.

### 6. Enforce player ownership on reservation detail reads
`reservation.getDetail` should enforce player ownership for player callers, matching the current protection already present in `getPaymentInfo` and linked-detail reads.

Alternatives considered:
- Leave detail unscoped and rely on URL secrecy: rejected because the canonical route becomes the primary player reservation surface.

## Risks / Trade-offs

- [Inline payment makes the page too large] → Keep payment UI in focused components and unify orchestration, not all rendering internals
- [Overview/payment/loading states cause layout flicker] → Keep one stable page shell, reuse consistent section structure, and size loading placeholders to the final layout
- [Step normalization loops] → Use one deterministic step resolver and only replace when URL state differs from the effective step
- [Linked/group payment diverges from single payment] → Drive both from the same shell and linked-detail query model
- [Stale CTAs keep pointing to `/payment`] → Remove the old route helper and update all player-facing links in the same cut
- [Canonical detail reads expose unauthorized data] → Add explicit player ownership checks to the reservation detail path
