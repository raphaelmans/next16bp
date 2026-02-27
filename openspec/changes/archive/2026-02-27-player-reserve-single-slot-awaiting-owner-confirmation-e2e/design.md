## Context

The booking UI now supports multiple interaction patterns in Availability Studio (`Week` vs `Day`, `Pick a court` vs `Any court`, and a booking-summary `Select a time` CTA). Current e2e selection logic is brittle across these variants. Manual browser validation confirms the end-to-end path works for authenticated players, but Playwright currently fails to deterministically produce a selected single slot and reach review.

## Goals / Non-Goals

**Goals:**
- Make player booking e2e deterministic for the single-slot happy path.
- Guarantee authentication before booking actions.
- Enforce acceptance assertions for awaiting-owner-confirmation status after submit.
- Define test-fixture fallback rules when no selectable slot is available.

**Non-Goals:**
- Redesign booking UI components.
- Change reservation state machine/backend contracts.
- Add broad full-suite e2e stabilization beyond this specific critical path.

## Decisions

1. Keep one focused spec for the acceptance path.
- Rationale: This user story is business-critical and should fail fast with actionable diagnostics.
- Alternative considered: Split into many small specs; rejected for now to avoid fixture fragmentation.

2. Use explicit authenticated login redirect in helper (`/login?redirect=/venues/:slug`).
- Rationale: Venue page can render for anonymous users; implicit redirect is not reliable.
- Alternative considered: Session/cookie reuse; rejected because it is not deterministic across CI/local.

3. Normalize selection strategy by mode in order:
- set `Book` mode,
- set `Pick a court`,
- select a concrete court,
- choose a reservable start time,
- continue to review.
- Rationale: This mirrors the actual reservation intent (one court, one slot) and avoids "browse-only" any-court view.
- Alternative considered: direct query-param navigation to book page; rejected as non-representative of UI flow.

4. Fail loudly (not skip) when no selectable slot exists.
- Rationale: silent skip hides regression and fixture drift.
- Alternative considered: skip to keep pipeline green; rejected for critical-path confidence.

5. Keep post-submit assertions contract-focused:
- status badge with `data-status="CREATED"`
- text: `Owner review is in progress.`
- text: `Reservation requested`
- Rationale: these are stable user-facing + state indicators for awaiting owner confirmation.

## Risks / Trade-offs

- [Environment has no reservable slots at runtime] -> Mitigation: require known fixture venue + explicit error with diagnostics and artifact retention.
- [Availability Studio markup continues to evolve] -> Mitigation: isolate selectors in helper functions and prefer role/name contracts over fragile CSS.
- [Flakiness from async hydration/loading overlays] -> Mitigation: wait for mode controls before interaction and keep screenshot/video artifacts on failure.
