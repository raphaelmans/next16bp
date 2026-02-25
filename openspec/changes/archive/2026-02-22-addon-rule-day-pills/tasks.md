## 1. Helpers — Collapse / Expand Pure Functions

- [x] 1.1 Add `AddonRuleGroup` type to `src/features/court-addons/helpers.ts` (UI-layer only: `{ days: number[], startMinute, endMinute, hourlyRateCents: number | null, currency: string | null }`)
- [x] 1.2 Implement `collapseRulesToGroups(rules: CourtAddonRuleForm[]): AddonRuleGroup[]` — group by `(startMinute, endMinute, hourlyRateCents ?? 'flat', currency ?? 'flat')` key, collect `dayOfWeek` values into `days[]`
- [x] 1.3 Implement `expandGroupsToRules(groups: AddonRuleGroup[]): CourtAddonRuleForm[]` — emit one `CourtAddonRuleForm` per day in `group.days[]`; emit zero rows for empty `days[]`

## 2. Unit Tests — Helpers (domain-logic.md pattern)

- [x] 2.1 Create `src/__tests__/features/court-addons/helpers.test.ts` (pure, no mocks, no network)
- [x] 2.2 Table-driven `collapseRulesToGroups` cases: (a) 5 identical HOURLY weekday rows → 1 group with 5 days; (b) FLAT Sa/Su rows → 1 group with 2 days; (c) Mon ₱500 + Sat ₱800 same times → 2 groups; (d) single Mon row → 1 group with 1 day
- [x] 2.3 Table-driven `expandGroupsToRules` cases: (a) group with 3 days → 3 rows; (b) group with empty days → 0 rows; (c) FLAT group → rows with `hourlyRateCents: null`
- [x] 2.4 Round-trip test: `expandGroupsToRules(collapseRulesToGroups(rows))` equals original `rows` (sorted by dayOfWeek for comparison)

## 3. Unit Tests — Pricing Engine Spec Gaps

- [x] 3.1 In existing schedule-availability test file, add: FLAT add-on with zero rule windows → `totalPriceCents` excludes flat fee, no hard error
- [x] 3.2 Add: two AUTO HOURLY add-ons covering same segment → both rates accumulated independently
- [x] 3.3 Add: HOURLY add-on window wider than booking → charges only covered segments (not full window)

## 4. DayPills Component

- [x] 4.1 Add inline `DayPills` component to `src/features/owner/components/court-addon-editor.tsx` — 7 toggle buttons (`Su M T W Th F Sa`), accepts `selected: number[]` + `onChange: (days: number[]) => void`
- [x] 4.2 Style: active pill = `bg-primary text-primary-foreground rounded-full h-7 w-7 text-xs font-semibold`; inactive = `bg-muted text-muted-foreground`; `transition-colors` on toggle
- [x] 4.3 Each button is `type="button"` (no accidental form submit)

## 5. CourtAddonEditor — Rule Row Redesign

- [x] 5.1 Shift internal rule state from `CourtAddonRuleForm[]` to `AddonRuleGroup[]` per addon — call `collapseRulesToGroups` on data load
- [x] 5.2 Replace `<Select>` Day dropdown in each rule row with `<DayPills>` component
- [x] 5.3 Wire `DayPills` onChange to update `group.days` for the correct addon + group index
- [x] 5.4 On save: call `expandGroupsToRules(groups)` to produce `CourtAddonRuleForm[]` before passing to existing `mapCourtAddonFormsToSetPayload`

## 6. Validation Updates

- [x] 6.1 Add empty-day-group validation: if any group has `days.length === 0`, add to blocking issues set and show "Select at least one day" inline on that rule row
- [x] 6.2 Pass expanded rules (via `expandGroupsToRules`) to existing `hasOverlappingRules` — no change to overlap logic itself
- [x] 6.3 For FLAT addons with zero rule groups: show non-blocking yellow advisory "No windows configured — this add-on will never be charged" (does not block save)

## 7. Validation Banner Alignment

- [x] 7.1 Update the `hasBlockingIssues` check to include empty-day-group condition
- [x] 7.2 Update the alert description text to mention "no days selected" alongside existing messages (empty labels, invalid ranges, overlapping windows)

## 8. Lint & Smoke

- [x] 8.1 Run `pnpm lint` — zero new errors
- [x] 8.2 Open Setup → Schedule step for a court with a HOURLY addon; verify pills render, multi-day selection works, save round-trips correctly
- [x] 8.3 Open same page for a FLAT addon; verify no rate field on rule rows, advisory shows when no windows configured
<!-- 8.2 and 8.3 require manual browser smoke test -->
