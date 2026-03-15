# Phase 1: Data Model + DTO Updates

**Dependencies:** None  
**Parallelizable:** Partial (1A before 1B)  
**User Stories:** US-18-01, US-18-02

---

## Objective

Extend the claim-request storage model to capture guest removal metadata and update removal DTOs to support guest submissions.

---

## Modules

### Module 1A: Add Guest Metadata to Claim Request

**User Story:** `US-18-01`

#### Data Model

Add nullable guest metadata to `claim_request`:

- `guest_name` (varchar 150)
- `guest_email` (varchar 255)

These fields are set for guest removal requests only.

#### Drizzle Schema Changes

- Update `src/shared/infra/db/schema/claim-request.ts`
  - Add `guestName` and `guestEmail`
  - Ensure nullable

#### Migration

- Add SQL migration in `drizzle/0003_guest_removal_request.sql`
- Add `ALTER TABLE` columns + optional index on `guest_email` if needed

---

### Module 1B: Extend Removal Request DTOs

**User Story:** `US-18-01`

#### DTO Changes

Create a new DTO for guest removal requests:

```ts
const SubmitGuestRemovalRequestSchema = z.object({
  placeId: z.string().uuid(),
  guestName: z.string().min(2).max(150),
  guestEmail: z.string().email().max(255),
  requestNotes: z.string().min(10).max(1000),
});
```

Keep the existing owner removal DTO as-is for authenticated owners.

---

## Testing Checklist

- [ ] Migration applies cleanly.
- [ ] Guest fields are optional for non-guest requests.
- [ ] DTO validation rejects invalid guest inputs.
