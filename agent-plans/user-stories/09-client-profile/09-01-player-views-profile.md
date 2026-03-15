# US-09-01: Player Views Profile

**Status:** Active  
**Domain:** 09-client-profile  
**PRD Reference:** Section 7 Journey 2  
**Priority:** High

---

## Story

As a **player**, I want to **view my profile information** so that **I can see what contact details will be shared with court owners**.

---

## Context

When a player makes a reservation, their profile information (name, email, phone) is captured as a snapshot and shared with the court owner. Players need to see and manage this information.

---

## Acceptance Criteria

### Navigate to Profile

- Given I am authenticated
- When I navigate to `/account/profile`
- Then I see my profile page with current information

### Display Profile Data

- Given I am on the profile page
- When my profile loads
- Then I see:
  - Display Name (or placeholder if empty)
  - Email (or empty)
  - Phone Number (or empty)
  - Avatar (if set)

### Loading State

- Given I navigate to the profile page
- When the profile is loading
- Then I see a skeleton loading state
- And the form is not interactive

### Auto-Create Profile

- Given I am a new user without a profile
- When I visit the profile page
- Then a profile is automatically created for me
- And I see empty fields ready to fill

### Profile Completeness Indicator

- Given I am on the profile page
- When my profile is incomplete (missing name OR missing both email and phone)
- Then I see a warning/info message
- And the message explains what's needed for booking

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| New user, no profile | Auto-create empty profile |
| Network error loading | Show error state with retry |
| Session expired | Redirect to login |

---

## API Integration

### Fetch Profile

**Endpoint:** `profile.me`

**Response:**
```typescript
{
  id: string,
  userId: string,
  displayName: string | null,
  email: string | null,
  phoneNumber: string | null,
  avatarUrl: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Behavior:**
- If profile exists, returns it
- If no profile, creates one with null fields and returns it

### Frontend Hook (TO BE FIXED)

**File:** `src/features/reservation/hooks/use-profile.ts`

**Current (Broken):**
```typescript
export function useProfile() {
  return useQuery({
    queryFn: async () => null,  // BROKEN
  });
}
```

**Target (Fixed):**
```typescript
export function useProfile() {
  const trpc = useTRPC();
  return useQuery(trpc.profile.me.queryOptions());
}
```

---

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Profile Page | `/account/profile` | Container page |
| ProfileForm | `features/reservation/components/profile-form.tsx` | Display/edit form |
| ProfileFormSkeleton | Same file | Loading state |
| AvatarUpload | `features/reservation/components/avatar-upload.tsx` | Avatar display/upload |

---

## Testing Checklist

- [ ] Navigate to `/account/profile` when authenticated
- [ ] Profile data loads and displays
- [ ] Skeleton shows during loading
- [ ] Empty profile shows empty fields
- [ ] Completeness warning shows when incomplete
- [ ] New users get auto-created profile
- [ ] Error state shows on network failure
- [ ] Unauthenticated users redirected to login
