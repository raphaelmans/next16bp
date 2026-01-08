# Phase 3: UI Polish

**Module IDs:** 3A, 3B  
**Estimated Time:** 30 minutes  
**Dependencies:** Phase 1, Phase 2

---

## Objective

Update the UI to correctly handle profile completeness and provide clear guidance to users.

---

## Implementation Steps

### Step 1: Update Form Labels (3A - Optional)

**File:** `src/features/reservation/components/profile-form.tsx`

**Current:**
```tsx
<Label htmlFor="email">Email</Label>
<Label htmlFor="phoneNumber">Phone Number</Label>
```

**Enhanced (Optional):**
```tsx
<Label htmlFor="email" className="flex items-center gap-2">
  Email
  <span className="text-xs text-muted-foreground font-normal">
    (required for booking)
  </span>
</Label>

<Label htmlFor="phoneNumber" className="flex items-center gap-2">
  Phone Number
  <span className="text-xs text-muted-foreground font-normal">
    (required for booking)
  </span>
</Label>
```

**Or simpler note below fields:**
```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" {...register("email")} />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="phoneNumber">Phone Number</Label>
    <Input id="phoneNumber" {...register("phoneNumber")} />
  </div>
  
  <p className="text-sm text-muted-foreground">
    At least one contact method (email or phone) is required for booking.
  </p>
</div>
```

---

### Step 2: Fix Booking Page Completeness Check (3B)

**File:** `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`

**Current (Incorrect):**
```typescript
// Requires ALL three fields
const isProfileComplete = 
  !!profile?.displayName && 
  !!profile?.email && 
  !!profile?.phoneNumber;
```

**Fixed (Matches Backend):**
```typescript
// Requires displayName + (email OR phone)
const isProfileComplete = 
  !!profile?.displayName && 
  (!!profile?.email || !!profile?.phoneNumber);
```

**Location:** Find this in the booking page component, likely near the profile check section.

---

## Optional Enhancements

### Profile Completeness Indicator

If the profile page doesn't already show a completeness indicator, you can add one:

**File:** `src/features/reservation/components/profile-form.tsx`

Add after the form, before the save button:

```tsx
{/* Profile status indicator */}
{profile && (
  <Alert 
    variant={
      profile.displayName && (profile.email || profile.phoneNumber)
        ? "default"
        : "warning"
    }
  >
    <Info className="h-4 w-4" />
    <AlertDescription>
      {profile.displayName && (profile.email || profile.phoneNumber) ? (
        <>Your profile is complete and ready for booking.</>
      ) : (
        <>
          Please add {!profile.displayName && "a display name"}
          {!profile.displayName && !profile.email && !profile.phoneNumber && " and "}
          {profile.displayName && !profile.email && !profile.phoneNumber && " "}
          {!profile.email && !profile.phoneNumber && "a contact method (email or phone)"}
          {" "}to make reservations.
        </>
      )}
    </AlertDescription>
  </Alert>
)}
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/features/reservation/components/profile-form.tsx` | Add contact requirement hint (optional) |
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Fix completeness check logic |

---

## Completeness Check Locations

Ensure these locations use the correct logic:

1. **Booking page** (`/courts/[id]/book/[slotId]`)
   - `isProfileComplete` check
   - Reserve button disabled state

2. **Profile form** (optional enhancement)
   - Completeness indicator
   - Guidance message

3. **Backend validation** (already done in Phase 2)
   - Use case validation
   - Error message

---

## UI/UX Considerations

### Warning Message on Booking Page

The existing booking page already shows the warning. Verify it's correct:

```tsx
{!isProfileComplete && (
  <Alert variant="warning">
    <AlertDescription>
      Please complete your profile before booking. Your contact 
      information will be shared with the court owner.
    </AlertDescription>
    <Button asChild variant="link" className="mt-2">
      <Link href="/account/profile">Complete Profile</Link>
    </Button>
  </Alert>
)}
```

### Reserve Button

Ensure the button is properly disabled:

```tsx
<Button 
  onClick={handleConfirm}
  disabled={!isProfileComplete || isLoading}
>
  Reserve
</Button>
```

---

## Testing

### Visual Testing

1. **Profile Page:**
   ```
   1. Navigate to /account/profile
   2. Verify labels are clear
   3. Check if hint text shows (if added)
   4. Verify completeness indicator (if added)
   ```

2. **Booking Page:**
   ```
   1. Go to /courts/[id]/book/[slotId] with incomplete profile
   2. Verify warning shows
   3. Verify Reserve button is disabled
   4. Complete profile (add displayName + email)
   5. Return to booking page
   6. Verify Reserve button is now enabled
   ```

### Functional Testing

Test all combinations:

| displayName | email | phone | Expected Result |
|-------------|-------|-------|----------------|
| ✅ | ✅ | ❌ | Complete ✅ |
| ✅ | ❌ | ✅ | Complete ✅ |
| ✅ | ✅ | ✅ | Complete ✅ |
| ✅ | ❌ | ❌ | Incomplete ❌ |
| ❌ | ✅ | ❌ | Incomplete ❌ |
| ❌ | ❌ | ✅ | Incomplete ❌ |
| ❌ | ❌ | ❌ | Incomplete ❌ |

---

## Checklist

- [ ] Update profile form labels (optional)
- [ ] Add completeness hint text (optional)
- [ ] Fix booking page completeness check
- [ ] Verify Reserve button disabled logic
- [ ] Test with incomplete profile
- [ ] Test with complete profile (name + email)
- [ ] Test with complete profile (name + phone)
- [ ] Test with complete profile (all three)
- [ ] Verify UI is consistent with backend
