# Phase 4: Admin Review Updates

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** US-18-02

---

## Objective

Surface guest contact details in admin claim review screens while keeping the existing review workflow unchanged.

---

## Modules

### Module 4A: Admin Review UI Enhancements

**User Story:** `US-18-02`

#### Data Updates

- Extend claim admin response to include guest name + email (nullable)
- Update admin hooks (`useClaims`, `useClaim`) to map guest fields

#### UI Updates

- In `src/app/(admin)/admin/claims/[id]/page.tsx`, show guest contact info when requestType is REMOVAL and guest data is present.
- Keep existing organization + owner details for owner-submitted removals.

---

## Testing Checklist

- [ ] Guest name/email appear on removal request details.
- [ ] Claim review actions still function.
- [ ] Approved/rejected flows unchanged.
