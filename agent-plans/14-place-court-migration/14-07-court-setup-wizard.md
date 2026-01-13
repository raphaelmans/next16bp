# Phase 3D: Court Setup Wizard + Copy Config

**Dependencies:** Phase 3 (Owner UI) baseline exists  
**Parallelizable:** Partial (frontend + small backend API work)  
**User Stories:** US-14-14, US-14-15

---

## Objective

Provide a unified, step-driven court setup experience and allow owners to copy hours/pricing from other courts in the same organization.

---

## Modules

### Module A: Wizard Entry Route + Navigation

**Goal:** Single entrypoint for court configuration with stepper UI.

- Add `/owner/places/:placeId/courts/:courtId/setup` page.
- Update courts list row click to open setup wizard.
- Add “Setup Wizard” item in court actions dropdown.
- Preserve existing deep links (`/edit`, `/hours`, `/pricing`, `/slots`).

---

### Module B: Wizard Steps

**Step 1 — Details (forced save)**
- Embed `CourtForm`.
- CTA: `Save & Continue`.
- If form not dirty, allow continue without mutation.

**Step 2 — Hours**
- Embed reusable `CourtHoursEditor`.
- CTA: `Save & Continue`.

**Step 3 — Pricing**
- Embed reusable `CourtPricingEditor`.
- CTA: `Save & Continue`.

**Step 4 — Publish**
- Show readiness (hours/pricing status).
- Primary CTA: open bulk slot modal inline.
- Secondary CTA: link to full slots page.
- Disable publish if prereqs missing.

---

### Module C: Copy From Another Court (Hours + Pricing)

**Goal:** Replace target configuration using a source court in the same organization.

- Add “Copy from another court” button on Hours and Pricing steps.
- Show dialog with source court picker (across org).
- Replace (delete + insert) target windows/rules.
- Copy pricing currency exactly.

---

## API Endpoints

| Endpoint | Type | Input | Output |
|---------|------|-------|--------|
| `courtHours.copyFromCourt` | Mutation | `{ sourceCourtId, targetCourtId }` | `CourtHoursWindowRecord[]` |
| `courtRateRule.copyFromCourt` | Mutation | `{ sourceCourtId, targetCourtId }` | `CourtRateRuleRecord[]` |

---

## UI Layout (Wizard)

```text
Court Setup · {Court Name}
Step 2 of 4 · Hours

[Stepper]
Details → Hours → Pricing → Publish

[Hours Editor]
- Rows
- Add window
- Copy from another court

[Back]                      [Save & Continue]
```

---

## Flow Diagram (Wizard Navigation)

```text
/setup?step=details
   | Save & Continue
   v
/setup?step=hours
   | Save & Continue
   v
/setup?step=pricing
   | Save & Continue
   v
/setup?step=publish
   | Publish slots (modal)
   | or Manage slots (link)
```

---

## Implementation Steps

1. Add new wizard route + appRoutes helper.
2. Extract Hours/Pricing editors into reusable components.
3. Add copy-from-court dialogs and hooks.
4. Implement copy mutations (hours + pricing) with org ownership checks.
5. Wire wizard navigation + stepper UI with forced save on details.
6. Update courts list row click + actions menu.

---

## Testing Checklist

- [ ] Court setup wizard loads with step indicator.
- [ ] Step 1 requires Save & Continue; no-change still proceeds.
- [ ] Copy hours/pricing replaces target rows and uses same currency.
- [ ] Copy rejects cross-org source.
- [ ] Publish step blocks if hours/pricing missing.
- [ ] Existing deep links still work.

---

## Handoff Notes

- Document how to migrate owners to the wizard as default entrypoint.
- Consider warning when copying across places with different time zones.
