## Context

Add-ons are currently court-scoped (`court_addon` table). Three issues coexist:

1. **Pricing input bug**: The editor surfaces raw cent values — an owner entering `150` stores 150¢ (₱1.50). No DB change needed; the fix is purely in the input component.
2. **FLAT add-ons are window-dependent**: The pricing engine only charges a FLAT fee when a booking segment overlaps a rule window. FLAT fees are by definition unconditional; requiring windows is a design contradiction.
3. **No venue-level scope**: Owners want to configure a single "paddle rental" add-on that appears on all courts. Today every court must be configured independently.

Existing affected files: `court-addon-editor.tsx`, `schedule-availability.ts`, `court_addon` schema, tRPC root.

## Goals / Non-Goals

**Goals:**
- Fix the ₱ cents/units input mismatch in the editor with zero DB schema change.
- Remove the window requirement for FLAT add-ons — charge unconditionally per booking.
- Introduce `place_addon` / `place_addon_rate_rule` tables and a `placeAddon` tRPC router.
- Allow the pricing engine to process GLOBAL (venue-level) add-ons alongside SPECIFIC (court-level) add-ons.
- Owner UI: venue-level `PlaceAddonEditor`; read-only inherited GLOBAL panel in `CourtAddonEditor`.
- Player UI: merged GLOBAL+SPECIFIC add-on list in booking flow.

**Non-Goals:**
- Per-court opt-out of inherited GLOBAL add-ons (courts always inherit all GLOBAL add-ons).
- Migration of existing `court_addon` rows to GLOBAL scope — they stay as SPECIFIC.
- Multi-currency handling beyond what already exists for court add-ons.
- Admin tooling for place add-ons.

## Decisions

### D1: FLAT add-ons are lifted out of the per-segment loop

**Decision**: Pre-compute FLAT add-on charges before the hourly segment loop and add them directly to `totalPriceCents`.

**Rationale**: FLAT fees are per-booking, not per-segment. Keeping them inside the loop requires dummy rule windows and makes the "never charged" edge case a permanent foot-gun. Lifting them out makes the intent self-documenting.

**Alternative considered**: Keep FLAT inside the loop but auto-generate a catch-all window (00:00–24:00 all days). Rejected — it hides the semantic intent and bloats the rule table.

### D2: GLOBAL add-ons use separate tables (`place_addon`, `place_addon_rate_rule`)

**Decision**: Mirror the existing `court_addon` / `court_addon_rate_rule` table pair at the place level rather than adding a `scope` column to `court_addon`.

**Rationale**: Separate tables keep FK constraints clean (`place_addon.place_id → place.id`) and avoid nullable `court_id` in the existing table. The two scopes have different ownership rules and different UI surfaces; keeping them separate avoids conditional logic in every query.

**Alternative considered**: Add `scope ENUM('GLOBAL','SPECIFIC')` + nullable `court_id` to `court_addon`. Rejected — nullable FK is a schema smell and would require migration of existing rows.

### D3: Pricing engine signature extended with optional `venueAddons`

**Decision**: Add `venueAddons?: ScheduleAddon[]` to `computeSchedulePriceDetailed()` options. Callers that don't pass it get existing behavior unchanged.

**Rationale**: Backwards-compatible; existing callers need no changes. GLOBAL add-ons go through identical evaluation logic as SPECIFIC — the only difference is they're always included regardless of court.

### D4: FLAT rule section hidden in editor rather than removed from schema

**Decision**: When `pricingType === "FLAT"`, hide the schedule-rules UI section. FLAT add-ons are saved with `groups: []` (no rules). The DB schema allows FLAT with zero rules already.

**Rationale**: Hiding is immediate and safe. Existing FLAT add-ons that already have rule rows continue to work in the pricing engine (the rules are simply ignored under the new logic). We avoid a destructive migration.

### D5: Input display in currency units (₱), storage in cents unchanged

**Decision**: Divide stored `flatFeeCents` / `hourlyRateCents` by 100 for display; multiply on change.

**Rationale**: Minimal blast radius — no API, DB, or service changes. Pure UI fix.

## Risks / Trade-offs

- **Existing FLAT add-ons with rule rows**: After the engine change, those rule rows become dead data. This is benign — the pricing result is now correct (charged unconditionally) vs. previously gated on window overlap. Risk: Low.
- **Callers of `computeSchedulePriceDetailed` not passing `venueAddons`**: They silently skip GLOBAL add-ons, which is correct until they're updated. Risk: Low — additive change.
- **DB migration required**: `place_addon` and `place_addon_rate_rule` tables must be created before deploy. Rollback is a DROP TABLE — no data loss since no existing data references these tables. Risk: Low.
- **Input conversion edge cases**: Non-integer cent values (e.g. ₱1.505 → 150.5¢) are rounded via `Math.round`. This matches standard financial input patterns. Risk: Low.

## Migration Plan

1. Add Drizzle schema files → run `pnpm db:generate` → `pnpm db:migrate`.
2. Deploy backend (new `placeAddon` router registered; pricing engine updated).
3. Deploy frontend (editor fix; new `PlaceAddonEditor`; booking flow update).
4. No data backfill needed. Existing `court_addon` rows remain unchanged as SPECIFIC.

Rollback: revert deploy; drop `place_addon` and `place_addon_rate_rule` tables (no orphan data).

## Open Questions

- Should GLOBAL HOURLY add-on currency be validated against place-level base pricing (rather than court-level rate rules)? Currently: service validates against rate rules of any court in the place. Deferred — initial impl skips cross-court currency validation for GLOBAL add-ons.
- Display order interleaving: should GLOBAL add-ons always appear before SPECIFIC in player UI, or sorted by `display_order`? Initial impl: GLOBAL first.
