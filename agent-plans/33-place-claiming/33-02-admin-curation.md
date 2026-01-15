# Phase 2: Admin Curation Supports Explicit Courts

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial (DTOs before UI)  
**User Stories:** US-17-01

---

## Objective

Allow admins to curate a place with explicit, multi-sport court inventory that mirrors the owner court model.

---

## Modules

### Module 2A: Curated Place DTO Includes `courts[]`

#### DTO Updates

Add a required `courts` array to curated place creation DTOs.

- `CreateCuratedCourtSchema` includes:
  - `courts: Array<{ label: string; sportId: uuid; tierLabel?: string }>`

- Batch schema includes `courts[]` for each item.

#### Acceptance

- [ ] Validation requires at least 1 court.
- [ ] Each court requires label + sport.

---

### Module 2B: Admin Create Endpoints Create Court Rows

#### Behavior

During curated place creation transaction:
- Create `place` (CURATED, UNCLAIMED)
- Create `place_contact_detail`
- Create `court` rows for each item in `courts[]`

#### Notes

- Courts for curated places are visible publicly, but booking remains disabled until claim approval.

---

## Testing Checklist

- [ ] Created curated place includes the expected number of courts.
- [ ] Courts can have mixed sports.
- [ ] Public place detail shows the courts.
