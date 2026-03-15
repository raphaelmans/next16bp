# Phase 5: Cutover QA + Polish

**Dependencies:** Phases 1–4 complete  
**Parallelizable:** Partial  
**User Stories:** All

---

## Objective

Validate end-to-end behavior of the new Place/Court model and booking flows.

---

## Validation Checklist

### Data Setup

- [ ] At least 1 place exists with time zone `Asia/Manila`
- [ ] At least 2 courts exist under the same place (same sport) to test “Any available”
- [ ] Hours windows include an overnight example (e.g., 22:00–02:00)
- [ ] Pricing rules cover at least two windows (e.g., day vs night)
- [ ] Slots exist in 60-min increments across at least one day

### Player Flow

- [ ] Discovery filter by sport returns correct places
- [ ] Place detail shows courts
- [ ] Can book specific court for 60 minutes
- [ ] Can book 120 minutes (2 consecutive slots)
- [ ] Any available picks lowest total price
- [ ] Reservation details show assigned court

### Owner Flow

- [ ] Owner can create place + courts
- [ ] Owner can configure hours and pricing
- [ ] Owner can publish slots
- [ ] Owner filters by place/court

### Engineering

- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes

---

## Release Notes (dev)

- Clean cutover: all data is new schema.
- No backward compatibility for legacy IDs assumed.
