# US-09-02: Player Updates Profile

**Status:** Active  
**Domain:** 09-client-profile  
**PRD Reference:** Section 7 Journey 2, Section 8.5  
**Priority:** High

---

## Story

As a **player**, I want to **update my profile information** so that **court owners have accurate contact details when I make reservations**.

---

## Context

Profile information is captured as a snapshot when reservations are created. Players need to keep their profile current to ensure owners can contact them.

---

## Acceptance Criteria

### Edit Profile Fields

- Given I am on the profile page
- When I modify any field (displayName, email, phone)
- Then the "Save Changes" button becomes enabled

### Validate Fields

- Given I am editing my profile
- When I enter invalid data:
  - Display name: empty or > 100 chars
  - Email: invalid format
  - Phone: > 20 chars
- Then I see validation error messages
- And I cannot save until fixed

### Save Changes

- Given I have made valid changes
- When I click "Save Changes"
- Then I see a loading indicator
- And on success, I see a success toast "Profile updated successfully"
- And the form resets to non-dirty state

### Cancel/Discard Changes

- Given I have unsaved changes
- When I navigate away from the page
- Then I can leave (no blocking)
- Note: Optional UX enhancement to warn about unsaved changes

### Avatar Display (Deferred)

- Given I am on the profile page
- When I see the avatar section
- Then I see my current avatar (or initials placeholder)
- And I see an upload button (non-functional in this phase)
- Note: Avatar upload deferred to future enhancement

---

## Field Requirements

| Field | Required | Validation | Max Length |
|-------|----------|------------|------------|
| Display Name | Yes | Non-empty | 100 |
| Email | Conditional* | Valid email format | 255 |
| Phone Number | Conditional* | Any format | 20 |
| Avatar URL | No | Valid URL | - |

*At least one of email OR phone is required for booking.

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Save with empty required field | Show validation error |
| Network error on save | Show error toast, keep form state |
| Concurrent update | Last write wins (acceptable for MVP) |
| Very long input | Truncate/reject at validation |

---

## API Integration

### Update Profile

**Endpoint:** `profile.update`

**Input:**
```typescript
{
  displayName?: string,    // min 1, max 100
  email?: string,          // valid email
  phoneNumber?: string,    // max 20
  avatarUrl?: string       // valid URL
}
```

**Response:** Updated profile object

### Frontend Hook (TO BE FIXED)

**File:** `src/features/reservation/hooks/use-profile.ts`

**Current (Broken):**
```typescript
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (data) => {
      throw new Error("Not implemented");  // BROKEN
    },
  });
}
```

**Target (Fixed):**
```typescript
export function useUpdateProfile() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  return useMutation(
    trpc.profile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );
}
```

---

## UI Components

| Component | Purpose |
|-----------|---------|
| ProfileForm | Main form with react-hook-form |
| Input fields | Display name, email, phone |
| AvatarUpload | Shows avatar, upload button (deferred) |
| Save button | Submits form, disabled when pristine |

---

## Form Behavior

```typescript
// Form schema (frontend)
const profileSchema = z.object({
  displayName: z.string().min(1, "Required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});
```

---

## Testing Checklist

- [ ] Edit display name and save
- [ ] Edit email and save
- [ ] Edit phone and save
- [ ] Validation errors show for invalid input
- [ ] Save button disabled when no changes
- [ ] Save button disabled during submission
- [ ] Success toast appears on save
- [ ] Error toast appears on failure
- [ ] Form resets dirty state after save
- [ ] Profile data persists after page refresh
