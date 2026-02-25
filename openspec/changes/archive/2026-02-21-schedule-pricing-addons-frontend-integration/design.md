## Context

Add-on pricing behavior is already implemented in backend services and pricing evaluation, but frontend surfaces still expose only base schedule/rate flows. Owners cannot configure add-ons in setup UI, and players cannot select optional add-ons or view add-on-aware totals/warnings during booking.

This change spans three feature areas (`owner`, `discovery`, `reservation`) and must preserve the existing architecture contract: route boundaries in `src/app/**`, feature UI in `src/features/**`, and data flow through feature adapters/hooks into tRPC transport.

## Goals / Non-Goals

**Goals:**
- Integrate owner add-on configuration UI into existing court setup with parity-safe validations and clear copy.
- Integrate player add-on selection into discovery/booking flows and thread `selectedAddonIds` through availability + reservation payloads.
- Surface backend pricing warnings and transparent base-vs-addon total breakdown in booking/review UX.
- Reuse current design system and copy tone while improving clarity, accessibility, and mobile responsiveness.

**Non-Goals:**
- Changing backend pricing rules, schema, or add-on semantics.
- Introducing `AUTO_STRICT` or new pricing engine behavior.
- Broad visual redesign outside booking/setup surfaces affected by add-ons.

## Decisions

1. **Use a dedicated frontend add-on feature module**
   - Decision: Add shared frontend integration pieces under `src/features/court-addons/**` (helpers/schemas/hooks/components) and compose from `owner`, `discovery`, and `reservation` features.
   - Rationale: Avoids duplicating add-on view-model logic across flows and keeps component/payload transforms deterministic.
   - Alternatives considered:
     - Keep add-on logic inside each feature independently: faster short term, higher drift risk and duplicated copy/validation behavior.

2. **Preserve feature data chain for all new integrations**
   - Decision: Route UI -> feature hooks/adapters -> feature API -> tRPC transport, including new `courtAddon` usage in owner flows.
   - Rationale: Matches repository migration conventions and keeps transport/cache behavior centralized.
   - Alternatives considered:
     - Direct transport calls in pages/components: faster wiring but violates architecture boundaries and increases coupling.

3. **Thread add-on selection as explicit state through discovery and booking**
   - Decision: Extend URL/book state with `selectedAddonIds`, validate against current court add-ons, and pass through availability/reservation calls.
   - Rationale: Maintains deterministic, sharable state and avoids hidden local state divergence between selection and checkout.
   - Alternatives considered:
     - Checkout-only ephemeral state: simpler UI state initially but brittle across redirects and deep-linking.

4. **Warnings are non-blocking and informational**
   - Decision: Render backend pricing warnings (for example AUTO partial coverage) as contextual alerts in booking/review without blocking submission unless backend hard-fails.
   - Rationale: Aligns with current runtime semantics (`AUTO` uncovered contributes `+0`) and improves transparency.
   - Alternatives considered:
     - Hard-block on warnings: inconsistent with current behavior and can cause avoidable booking friction.

5. **Copy and interaction patterns follow existing system, not redesign-first**
   - Decision: Reuse existing shadcn-based components, status badges, form validation style, and concise CTA voice.
   - Rationale: Delivers polished parity while avoiding design drift.
   - Alternatives considered:
     - New visual language for add-ons: more novelty but inconsistent and out of migration scope.

## Risks / Trade-offs

- [Risk] Any-court assignment can invalidate selected add-ons -> Mitigation: revalidate `selectedAddonIds` against resolved court add-ons and show non-destructive notice when IDs are dropped.
- [Risk] URL or query tampering with addon IDs -> Mitigation: treat IDs as untrusted input and filter against fetched active add-ons before payload submission.
- [Risk] Owner form complexity can increase setup friction -> Mitigation: progressive disclosure (collapsed sections), strong defaults, and concise helper text.
- [Trade-off] Additional UI state in booking flow increases implementation complexity -> Mitigation: centralize state helpers/schemas and add focused unit tests.

## Migration Plan

1. Add owner API adapter support for `courtAddon.get/set` and shared frontend add-on module.
2. Integrate owner setup UI for add-on management (mode/type/rules/flat fee/validation messages).
3. Integrate player add-on selection in discovery + booking review and thread `selectedAddonIds` through availability/reservation.
4. Add booking warning and total-breakdown UI for add-ons.
5. Add unit tests for new frontend add-on transforms/state helpers and run lint + target tests + manual smoke matrix.

Rollback strategy:
- Keep changes frontend-scoped and additive; disabling new UI entry points can revert behavior to base booking flows without data loss.
- If integration regressions appear, hide add-on selectors/panels behind existing feature toggles/conditional rendering while preserving backend functionality.

## Open Questions

- Should player-facing warning copy be shown only in checkout/review or also on slot cards before navigation?
- Should owner add-ons become publish-gating in setup or remain advisory for this phase?
