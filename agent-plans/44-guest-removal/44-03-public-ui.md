# Phase 3: Public UI Integration

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes  
**User Stories:** US-18-01

---

## Objective

Expose the removal request dialog on `/courts/[id]` for guest users and avoid anonymous file uploads.

---

## Modules

### Module 3A: Removal Request Dialog (Public Court Page)

**User Story:** `US-18-01`

#### UI Placement

- Add a new card below "Claim this venue" on `src/app/(public)/places/[placeId]/page.tsx`.
- Label: "Request listing removal" with short helper text.

#### Form Fields

| Field | Component | Validation |
|-------|-----------|------------|
| Full name | `StandardFormInput` | min 2, max 150 |
| Email | `StandardFormInput` | email format, max 255 |
| Reason | `StandardFormTextarea` | min 10, max 1000 |

#### UI Layout

```
┌──────────────────────────────┐
│ Request listing removal      │
│ Reason text + notes           │
│ [Request removal]             │
└──────────────────────────────┘
```

#### Interaction

- Dialog opens from button
- Submit uses `trpc.claimRequest.submitGuestRemoval`
- Success toast: "Removal request submitted"
- On success, invalidate `place.getById`
- Disabled state while submitting

---

### Module 3B: Prevent Guest File Uploads

**User Story:** `US-18-01`

- Ensure no file upload inputs are shown for the guest removal request.
- Keep existing file uploads gated by authenticated flows (payment proof, owner uploads).

---

## Testing Checklist

- [ ] Removal request dialog renders for curated places.
- [ ] Guest submission works without authentication.
- [ ] Form validation errors show on invalid input.
- [ ] No file upload controls appear for guests.
