# Place Claiming - Dev Checklist

**Focus Area:** Curated → reservable claim workflow  
**User Stories:** US-17-01 through US-17-05

---

## Phase 1: Data Model + API Contracts

- [ ] Rename `curated_place_detail` → `place_contact_detail` in Drizzle schema
- [ ] Update all references to new table export
- [ ] Refactor `PlaceRepository.findWithDetails()` response shape
- [ ] Update place discovery + place management services to use new shape
- [ ] Update claim approval to preserve contact detail

## Phase 2: Admin Curation Adds Courts

- [ ] Extend curated create DTOs to include `courts[]`
- [ ] Create court rows during curated place creation
- [ ] Update batch curated creation to include courts
- [ ] Update admin UI forms for nested courts list

## Phase 3: Public Place UX

- [ ] Add contact info section (public)
- [ ] Disable booking UI for curated places
- [ ] Add claim dialog (org + notes) for authenticated owners

## Phase 4: Owner Contact Editing

- [ ] Extend owner place form schema + UI
- [ ] Persist contact details on create/update
- [ ] Ensure public page reflects updates

## Validation

- [ ] Run `pnpm lint`
- [ ] Run `pnpm build`
