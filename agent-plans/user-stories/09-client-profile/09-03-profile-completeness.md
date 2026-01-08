# US-09-03: Profile Completeness for Booking

**Status:** Active  
**Domain:** 09-client-profile  
**PRD Reference:** Section 7 Journey 2, Section 8.5  
**Priority:** High

---

## Story

As a **player**, I want to **be guided to complete my profile before booking** so that **court owners can contact me about my reservation**.

---

## Context

Court owners need player contact information to communicate about reservations (confirmations, changes, issues). The system must ensure profiles have minimum required data before allowing bookings.

---

## Profile Completeness Definition

```typescript
// A profile is complete when:
const isProfileComplete = 
  !!profile?.displayName && 
  (!!profile?.email || !!profile?.phoneNumber);

// Required: Name + at least one contact method
```

---

## Acceptance Criteria

### Booking Page - Complete Profile

- Given I have a complete profile (name + email or phone)
- When I am on the booking page (`/courts/[id]/book/[slotId]`)
- Then I see my profile information displayed
- And the "Reserve" button is enabled
- And I can complete my booking

### Booking Page - Incomplete Profile

- Given I have an incomplete profile
- When I am on the booking page
- Then I see a warning message:
  > "Please complete your profile before booking. Your contact information will be shared with the court owner."
- And I see a link/button to go to profile page
- And the "Reserve" button is disabled

### Profile Redirect Flow

- Given I am on the booking page with incomplete profile
- When I click the link to complete my profile
- Then I am taken to `/account/profile`
- And after completing profile, I can navigate back to booking
- Note: Optional enhancement to auto-redirect back

### Backend Validation

- Given I attempt to create a reservation via API
- When my profile is incomplete
- Then the API returns error: `INCOMPLETE_PROFILE`
- And the error message says: "Please complete your profile before booking"

### Error Handling

- Given the frontend check passes but backend rejects
- When reservation creation fails due to incomplete profile
- Then I see an error message guiding me to complete profile
- And I am not charged or penalized

---

## Validation Locations

| Location | Type | Purpose |
|----------|------|---------|
| Booking Page UI | Frontend | UX - disable button, show warning |
| Reservation Router | Backend | Security - prevent API bypass |
| Use Case | Backend | Business logic enforcement |

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Profile null (not loaded yet) | Treat as incomplete, show loading |
| Name only, no contact | Show "add email or phone" message |
| Email only, no name | Show "add display name" message |
| Both email and phone missing | Show "add email or phone" message |
| Profile loads after page | Re-evaluate completeness |
| API race condition | Backend is source of truth |

---

## API Integration

### Backend Validation

**File:** `src/modules/reservation/use-cases/create-*.use-case.ts`

**Add validation after profile fetch:**
```typescript
const profile = await this.profileRepository.findById(profileId, ctx);
if (!profile) {
  throw new ProfileNotFoundError(profileId);
}

// NEW: Validate profile completeness
if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
  throw new IncompleteProfileError();
}
```

### New Error Class

**File:** `src/modules/profile/errors/profile.errors.ts`

```typescript
export class IncompleteProfileError extends AppError {
  constructor() {
    super(
      "INCOMPLETE_PROFILE",
      "Please complete your profile before booking. " +
      "A display name and at least one contact method (email or phone) is required.",
      400
    );
  }
}
```

### Router Error Handling

**File:** `src/modules/reservation/reservation.router.ts`

```typescript
// Add to error handler
if (error instanceof IncompleteProfileError) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: error.message,
    cause: error,
  });
}
```

---

## UI Components

### Booking Page Warning

**Location:** `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`

```tsx
{!isProfileComplete && (
  <Alert variant="warning">
    <AlertDescription>
      Please complete your profile before booking. Your contact 
      information will be shared with the court owner.
    </AlertDescription>
    <Button asChild variant="link">
      <Link href="/account/profile">Complete Profile</Link>
    </Button>
  </Alert>
)}
```

### Profile Preview Card

Already exists: `ProfilePreviewCard` component shows profile summary on booking page.

---

## User Flow

```
/courts/[id] (select slot)
        │
        ▼
/courts/[id]/book/[slotId]
        │
        ├── Profile complete? ──► [Reserve] enabled
        │
        └── Profile incomplete?
                │
                ▼
        Warning message + link
                │
                ▼
        /account/profile (complete profile)
                │
                ▼
        Navigate back to booking
                │
                ▼
        [Reserve] now enabled
```

---

## Testing Checklist

### Frontend
- [ ] Complete profile: Reserve button enabled
- [ ] Incomplete profile: Reserve button disabled
- [ ] Warning message shows for incomplete profile
- [ ] Link to profile page works
- [ ] After completing profile, booking works

### Backend
- [ ] API rejects reservation with incomplete profile
- [ ] Error message is clear and actionable
- [ ] Complete profile: reservation succeeds
- [ ] Error code is `INCOMPLETE_PROFILE`

### Integration
- [ ] Full flow: incomplete → complete profile → book → success
- [ ] Backend catches frontend bypass attempts
- [ ] Error handling graceful on both ends
