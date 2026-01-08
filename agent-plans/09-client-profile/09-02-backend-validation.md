# Phase 2: Add Backend Validation

**Module IDs:** 2A, 2B, 2C  
**Estimated Time:** 30 minutes  
**Dependencies:** Phase 1 (Frontend Hooks)

---

## Objective

Add backend validation to prevent reservations with incomplete profiles. This ensures data quality and prevents API bypass.

---

## Implementation Steps

### Step 1: Create Error Class (2A)

**File:** `src/modules/profile/errors/profile.errors.ts`

Add new error class for incomplete profiles:

```typescript
export class IncompleteProfileError extends AppError {
  constructor() {
    super(
      "INCOMPLETE_PROFILE",
      "Please complete your profile before booking. A display name and at least one contact method (email or phone) is required.",
      400
    );
  }
}
```

**Also export it:**

```typescript
// Add to existing exports
export {
  ProfileNotFoundError,
  IncompleteProfileError,  // NEW
};
```

---

### Step 2: Add Validation to Use Cases (2B)

Both reservation use cases need the same validation.

#### File 1: `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts`

**Import the error:**

```typescript
import { 
  ProfileNotFoundError,
  IncompleteProfileError  // NEW
} from "@/modules/profile/errors/profile.errors";
```

**Add validation after profile fetch (around line 58-61):**

```typescript
// Get player profile for snapshot
const profile = await this.profileRepository.findById(profileId, ctx);
if (!profile) {
  throw new ProfileNotFoundError(profileId);
}

// NEW: Validate profile completeness
if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
  throw new IncompleteProfileError();
}
```

#### File 2: `src/modules/reservation/use-cases/create-free-reservation.use-case.ts`

**Same changes as above:**

Import:
```typescript
import { 
  ProfileNotFoundError,
  IncompleteProfileError  // NEW
} from "@/modules/profile/errors/profile.errors";
```

Add validation (around line 45-48):
```typescript
// Get player profile for snapshot
const profile = await this.profileRepository.findById(profileId, ctx);
if (!profile) {
  throw new ProfileNotFoundError(profileId);
}

// NEW: Validate profile completeness
if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
  throw new IncompleteProfileError();
}
```

---

### Step 3: Handle Error in Router (2C)

**File:** `src/modules/reservation/reservation.router.ts`

**Import the error:**

```typescript
import { 
  ProfileNotFoundError,
  IncompleteProfileError  // NEW
} from "@/modules/profile/errors/profile.errors";
```

**Add error handling in `handleReservationError` function (around line 40-60):**

```typescript
function handleReservationError(error: unknown): never {
  // ... existing error handlers ...
  
  // NEW: Handle incomplete profile
  if (error instanceof IncompleteProfileError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  
  if (error instanceof ProfileNotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  
  // ... other error handlers ...
}
```

---

## Validation Logic

The validation checks:

```typescript
if (!profile.displayName || (!profile.email && !profile.phoneNumber)) {
  throw new IncompleteProfileError();
}
```

**Breakdown:**
- `!profile.displayName` → Display name is required
- `!profile.email && !profile.phoneNumber` → At least one contact method required

**Valid profiles:**
- ✅ displayName + email
- ✅ displayName + phone
- ✅ displayName + email + phone

**Invalid profiles:**
- ❌ displayName only (no contact)
- ❌ email/phone only (no name)
- ❌ Empty profile

---

## Error Response

When validation fails, API returns:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Please complete your profile before booking. A display name and at least one contact method (email or phone) is required."
  }
}
```

The frontend will catch this and show the error message in a toast.

---

## Files Modified

| File | Change |
|------|--------|
| `src/modules/profile/errors/profile.errors.ts` | Add `IncompleteProfileError` class |
| `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts` | Add validation after profile fetch |
| `src/modules/reservation/use-cases/create-free-reservation.use-case.ts` | Add validation after profile fetch |
| `src/modules/reservation/reservation.router.ts` | Handle `IncompleteProfileError` in error mapper |

---

## Testing

### Unit Test (Optional)

```typescript
describe("CreatePaidReservationUseCase", () => {
  it("should reject incomplete profile (no contact)", async () => {
    // Setup: profile with displayName only
    const profile = {
      id: "...",
      displayName: "John Doe",
      email: null,
      phoneNumber: null,
    };
    
    // Expect: IncompleteProfileError
    await expect(
      useCase.execute(userId, profileId, slotId)
    ).rejects.toThrow(IncompleteProfileError);
  });
  
  it("should accept complete profile (name + email)", async () => {
    // Setup: profile with displayName + email
    const profile = {
      id: "...",
      displayName: "John Doe",
      email: "john@example.com",
      phoneNumber: null,
    };
    
    // Expect: Success
    const result = await useCase.execute(userId, profileId, slotId);
    expect(result).toBeDefined();
  });
});
```

### Manual Testing

1. **Test with incomplete profile:**
   ```
   1. Create account
   2. Don't fill profile (or only displayName)
   3. Try to book a court
   4. Verify error: "Please complete your profile..."
   ```

2. **Test with complete profile:**
   ```
   1. Fill displayName + email
   2. Try to book a court
   3. Verify booking succeeds
   ```

3. **Test frontend bypass attempt:**
   ```
   1. Disable frontend validation (dev tools)
   2. Try to book with incomplete profile
   3. Verify backend still rejects it
   ```

---

## Checklist

- [ ] Create `IncompleteProfileError` class
- [ ] Export from profile errors index
- [ ] Import error in paid reservation use case
- [ ] Add validation in paid reservation use case
- [ ] Import error in free reservation use case
- [ ] Add validation in free reservation use case
- [ ] Import error in reservation router
- [ ] Add error handler in router
- [ ] Test with incomplete profile (rejects)
- [ ] Test with complete profile (succeeds)
- [ ] Verify error message is user-friendly
