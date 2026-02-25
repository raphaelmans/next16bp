## Why

Owner-configured add-on prices are stored 100× too small (owners enter `₱150` but the system stores `150¢ = ₱1.50`) because the editor exposes raw cent values. Additionally, FLAT add-ons require schedule-rule windows to fire — which is architecturally wrong since flat fees are unconditional per-booking charges. Finally, add-ons are only court-scoped today, but owners think of extras (e.g. paddle rental) at the venue level and want to configure them once for all courts.

## What Changes

- **Bug fix**: Flat-fee and hourly-rate inputs in the court addon editor now accept currency units (₱) and convert to cents on store — no schema change required.
- **FLAT simplification**: FLAT add-ons no longer require schedule-rule windows; the pricing engine charges `flatFeeCents × quantity` once per booking unconditionally. The editor hides the "Schedule rules" section for FLAT add-ons.
- **GLOBAL/SPECIFIC scoping**: New `place_addon` and `place_addon_rate_rule` tables allow venue-level add-ons. GLOBAL add-ons are always inherited by all courts; courts cannot opt out. Existing court add-ons remain SPECIFIC.
- **New tRPC router**: `placeAddon.get` / `placeAddon.set` for venue-wide add-on management.
- **Pricing engine update**: `computeSchedulePriceDetailed()` accepts both `courtAddons` (SPECIFIC) and `venueAddons` (GLOBAL); processes both in a single pass.
- **Owner UI**: New `PlaceAddonEditor` component for GLOBAL add-ons; `CourtAddonEditor` shows inherited GLOBAL add-ons read-only.
- **Player UI**: Booking flow fetches and merges both scopes; GLOBAL OPTIONAL add-ons shown with "(venue-wide)" badge.

## Capabilities

### New Capabilities
- `place-addon-management`: Venue-level (GLOBAL) add-on CRUD — owner can create, edit, and delete add-ons that apply across all courts at a place.

### Modified Capabilities
- `addon-pricing-data-model`: Add GLOBAL/SPECIFIC scope concept; add `place_addon` and `place_addon_rate_rule` tables.
- `addon-pricing-evaluation`: FLAT add-ons now charge unconditionally (no window evaluation); pricing engine accepts venueAddons alongside courtAddons.
- `owner-court-addon-management-ui`: Editor hides schedule rules for FLAT; shows inherited GLOBAL add-ons read-only; venue-level editor added.
- `player-booking-addon-selection-ui`: Player sees merged GLOBAL+SPECIFIC add-ons; selection payload supports IDs from both scopes.

## Impact

- **DB**: Two new tables (`place_addon`, `place_addon_rate_rule`); two new Drizzle schema files; migration required.
- **Backend**: New module `src/lib/modules/place-addon/` (repository + service + factory + router + DTOs + errors); registered in `src/lib/shared/infra/trpc/root.ts`.
- **Pricing engine**: `src/lib/shared/lib/schedule-availability.ts` — FLAT logic moved out of per-segment loop; function signature extended with optional `venueAddons`.
- **Frontend**: `src/features/owner/components/court-addon-editor.tsx` (input conversion + FLAT rules hide + inherited section); new `src/features/place-addon/components/place-addon-editor.tsx`; `src/features/court-addons/helpers.ts` (combined addon utilities).
- **Availability/reservation call sites**: Must fetch and pass `venueAddons` to pricing engine.
- **No breaking API changes** for existing `courtAddon` router — purely additive.
