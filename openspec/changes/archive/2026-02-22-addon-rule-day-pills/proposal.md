## Why

Add-on rule windows currently use a single-day `[Day ▼]` dropdown, forcing owners to create one row per day for the same time range — configuring "Court Lights" Mon–Fri requires 5 identical rows. Replacing the dropdown with a multi-select day pill row eliminates this repetition and aligns the add-on editor UX with the mental model of weekly scheduling.

## What Changes

- Replace the `[Day ▼]` select in each addon rule window row with a row of 7 toggleable day pill buttons (`Su M T W Th F Sa`)
- A single rule row can now span multiple days simultaneously
- New UI-layer helpers collapse matching DB rows (same startMinute, endMinute, hourlyRateCents, currency) into a single combined pill row on load, and expand pill rows back to per-day DB rows on save
- Validation extended: a rule group must have at least one day pill selected; overlap detection still runs on expanded per-day rules before save
- FLAT addon rule rows receive the same day pill treatment (no rate field per row, since flat fee lives on the addon itself)
- No DB schema changes (`court_addon_rate_rule` continues storing one row per day)
- No API or pricing engine changes

## Capabilities

### New Capabilities
- `addon-rule-day-pills`: Multi-select day pill interaction for addon rule windows; UI collapse/expand helpers that map between per-day DB rows and grouped pill rows

### Modified Capabilities
- `owner-court-addon-management-ui`: Rule window interaction model changes from a per-day dropdown row to a multi-day pill row; validation gains a "must select at least one day" check per group
- `schedule-pricing-addons-testing`: Extend test coverage to include previously unspecified scenarios (FLAT with no windows, multi-AUTO interaction, collapse/expand round-trip fidelity) and align with `domain-logic.md` pure-function testing pattern for new helpers

## Impact

- `src/features/court-addons/helpers.ts` — add `collapseRulesToGroups()` and `expandGroupsToRules()` pure functions
- `src/features/court-addons/schemas.ts` — add `AddonRuleGroup` UI-layer type (not persisted)
- `src/features/owner/components/court-addon-editor.tsx` — rule window row redesign: swap `<Select>` for `<DayPills>`, shift internal state from `CourtAddonRuleForm[]` to `AddonRuleGroup[]`
- No backend, tRPC, or DB changes required
