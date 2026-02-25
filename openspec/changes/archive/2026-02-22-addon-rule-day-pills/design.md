## Context

`CourtAddonEditor` manages add-on rule windows as a flat `CourtAddonRuleForm[]` — one DB row per day. An owner configuring the same time window across Mon–Fri must create five identical rows, differing only in `dayOfWeek`. The `[Day ▼]` dropdown is the root cause.

The pricing engine (`computeSchedulePriceDetailed`) and DB schema (`court_addon_rate_rule`) both operate on per-day rows and are correct — this is a UI-layer problem only.

## Goals / Non-Goals

**Goals:**
- Replace `[Day ▼]` select with a 7-button multi-select day pill row (Su M T W Th F Sa)
- One UI rule row spans multiple days; DB still stores per-day rows (unchanged schema)
- Introduce `collapseRulesToGroups` / `expandGroupsToRules` pure helpers (feature-local, UI-only)
- New validation: a rule group must have ≥ 1 day selected
- Cover all identified spec gaps with deterministic unit tests following `domain-logic.md`

**Non-Goals:**
- Merging add-on config into `CourtScheduleEditor`
- Changing the pricing engine, tRPC API, or DB schema
- Modifying FLAT "always applies" semantics (spec requires windows)
- Changing how `CourtAddonRuleForm` is stored or transported

## Decisions

**1. Collapse/expand lives in `src/features/court-addons/helpers.ts`**
Per `domain-logic.md`, view-model shaping for a specific screen belongs in `src/features/<feature>/helpers.ts`. The collapse/expand logic is UI-only (groups visual rows, not a pricing invariant) so it is not shared under `src/lib/modules/`. Kept client-only, testable as pure functions.

**2. Grouping key: `(startMinute, endMinute, hourlyRateCents, currency)`**
Two DB rows collapse into one UI row only when all four fields match. Rationale: rows with the same time window but different rates are genuinely distinct rules — collapsing them would lose information. For FLAT addons both `hourlyRateCents` and `currency` are `null`; the key degenerates to `(startMinute, endMinute)` which is still correct.

**3. `AddonRuleGroup` is a UI-layer type, not in `schemas.ts`**
`schemas.ts` holds Zod-validated API/form contracts. `AddonRuleGroup` is ephemeral view-model state that never leaves the browser — it belongs as a local type in `court-addon-editor.tsx` or alongside the helpers.

**4. Validate on expanded form before save**
Existing `hasOverlappingRules(addon)` accepts `CourtAddonRuleForm[]`. Calling `expandGroupsToRules(groups)` before validation reuses the existing logic unchanged. No new overlap algorithm needed.

**5. Empty-day-group validation is a UI hard error (blocks save)**
A group with `days.length === 0` cannot produce any DB rows and almost certainly represents an accidental state. Treat as a blocking error with inline message "Select at least one day", consistent with how the existing editor treats `startMinute >= endMinute`.

**6. FLAT addon with no rule windows — owner warning, not hard error**
The pricing engine silently contributes ₱0 when no windows match. An owner with a FLAT addon and zero rule windows almost certainly misconfigured it. The editor SHALL surface a non-blocking advisory: "No windows configured — this add-on will never be charged." This is a warning (yellow), not a validation error (does not block save).

## Risks / Trade-offs

- **Round-trip fidelity** — `expandGroupsToRules(collapseRulesToGroups(rows))` must produce a set equivalent to the original rows (same records, possibly different order). Must be covered by table-driven unit tests.
- **Partial existing data** — if a court's HOURLY addon has Mon/Wed/Fri but not Tue/Thu at the same rate, the editor will show one row with M/W/F pills and the other days untouched. This is correct but may surprise owners who expected to see a single "weekday" row. No mitigation needed; the display reflects actual data.
- **Currency null grouping for FLAT** — grouping on `null` values requires explicit null-equality checks (not `===` on object keys). The helper must stringify the key safely (e.g. `JSON.stringify([start, end, rate ?? 'flat', cur ?? 'flat'])`).

## Migration Plan

No data migration. DB schema unchanged. The editor loads existing per-day rows, collapses to pill groups, renders the new UI. On save, expands back to per-day rows and calls the existing `useMutOwnerSaveCourtAddons` mutation.

## Open Questions

- Should "Copy to all days" be a shortcut button on each pill row (like "Copy to all" in the schedule editor)? Deferred — pills already solve the repetition problem; a copy button can be added later if owners request it.
