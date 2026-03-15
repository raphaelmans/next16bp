# 09 - Client Profile - User Stories Overview

**Status:** Active  
**Domain:** Client Profile Management  
**PRD Reference:** Section 7 Journey 2 (Profile Requirements), Section 8.5 (Player Snapshot)

---

## Summary

This module covers the player profile management functionality, which is a **prerequisite for making reservations**. Players must have a complete profile (displayName + email OR phone) before they can book a court.

---

## User Stories

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-09-01 | Player Views Profile | High | Not Started |
| US-09-02 | Player Updates Profile | High | Not Started |
| US-09-03 | Profile Completeness for Booking | High | Not Started |

---

## Current State Analysis

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Profile page route | Exists | `/account/profile` |
| ProfileForm component | Exists | UI complete, not wired |
| Backend `profile.me` | Complete | Returns/creates profile |
| Backend `profile.update` | Complete | Updates profile fields |
| `useProfile` hook | **BROKEN** | Returns `null`, not connected |
| `useUpdateProfile` hook | **BROKEN** | Throws "Not implemented" |
| Booking profile check | Exists | Frontend-only, always fails |

### Root Cause

The hooks in `src/features/reservation/hooks/use-profile.ts` are placeholders:

```typescript
// Current - BROKEN
export function useProfile() {
  return useQuery({
    queryKey: ["profile", "current"],
    queryFn: async () => {
      return null as Profile | null;  // Always returns null!
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (data) => {
      throw new Error("Not implemented");  // Always fails!
    },
  });
}
```

---

## Profile Completeness Definition

For a profile to be considered "complete" for booking purposes:

```typescript
// Required for booking
const isProfileComplete = 
  !!profile?.displayName && 
  (!!profile?.email || !!profile?.phoneNumber);
```

**Required:** displayName + (email OR phone)

This ensures the court owner has at least one way to contact the player.

---

## Personas

### Player (Primary)
- Wants to book courts quickly
- Needs minimal friction in profile setup
- Expects profile to persist across sessions

### Court Owner (Secondary)
- Needs player contact information
- Relies on profile snapshots for reservations
- May need to contact player about bookings

---

## Dependencies

```
09-client-profile (this module)
        │
        ▼
06-court-reservation (booking flow)
        │
        ▼
07-owner-confirmation (owner sees player info)
```

Profile completeness is checked in the booking flow (06) and player snapshots are displayed to owners (07).

---

## Document Index

| Document | Description |
|----------|-------------|
| `09-00-overview.md` | This file |
| `09-01-player-views-profile.md` | View profile user story |
| `09-02-player-updates-profile.md` | Update profile user story |
| `09-03-profile-completeness.md` | Booking prerequisite user story |

---

## Success Criteria

- [ ] Player can view their profile at `/account/profile`
- [ ] Player can update displayName, email, phone
- [ ] Profile persists across sessions
- [ ] Booking flow correctly detects incomplete profiles
- [ ] Backend validates profile completeness before reservation
- [ ] Error messages guide user to complete profile
