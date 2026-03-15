# Phase 3: Public Place UX (Curated Mode + Claim Dialog)

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** US-17-02, US-17-03

---

## Objective

Make curated places first-class on the public place detail page:

- Always show contact info publicly
- Always show courts publicly (read-only)
- Disable booking/availability UI for curated places
- Allow authenticated organization owners to submit a claim request via dialog (org + notes)

---

## Modules

### Module 3A: Curated Place Mode (Read-only)

#### UI Behavior

- If place is CURATED:
  - Show banner: "Not bookable yet"
  - Hide or disable booking widgets (sport/date/time selection and CTA)
  - Keep courts list visible (read-only)
  - Show contact info section

#### UX Notes (Design System)

- Use bento-style card sections with warm neutral borders.
- Use accent color for links (Orange) and primary for main CTA (Teal).
- Do not show a booking CTA for curated.

---

### Module 3B: Claim Dialog (Org + Notes)

#### Visibility Rules

- Only show claim CTA if:
  - user is authenticated
  - user has at least one organization
  - place is CURATED and UNCLAIMED

#### Dialog Fields

| Field | Type | Required |
|-------|------|----------|
| Organization | select | Yes |
| Notes | textarea | No |

#### UX

- Primary button: "Submit claim" (Teal)
- Secondary button: "Cancel" (neutral outline)
- On success: toast success + refresh place data

---

## Testing Checklist

- [ ] Curated place page does not trigger availability calls.
- [ ] Authenticated owner can submit a claim.
- [ ] Non-authenticated users do not see claim UI.
- [ ] Public contact links render for curated and reservable.
