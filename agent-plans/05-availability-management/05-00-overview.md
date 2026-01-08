# 05 - Availability Management - Implementation Plan

**Version:** 1.0  
**Created:** January 8, 2025  
**Status:** Ready for Implementation

---

## Overview

This plan covers the implementation of time slot management for court owners, enabling them to create, view, and manage availability for their courts.

### User Stories Covered

| ID | Story | Priority |
|----|-------|----------|
| US-05-01 | Owner Creates Time Slots | High |
| US-05-02 | Owner Views and Manages Slots | High |

### Reference Documents

| Document | Location |
|----------|----------|
| User Stories | `agent-plans/user-stories/05-availability-management/` |
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 9 |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Existing UI | `src/features/owner/components/` |
| Backend | `src/modules/time-slot/` |

---

## Development Phases

| Phase | Description | Modules | Time Est. |
|-------|-------------|---------|-----------|
| 1 | Backend Enhancement | 1A | 2 hours |
| 2 | Frontend Hook Wiring | 2A, 2B | 3 hours |
| 3 | UI Polish & Integration | 3A | 2 hours |

**Total Estimated Time:** 7 hours

---

## Module Index

### Phase 1: Backend Enhancement

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 1A | Add `getForCourt` Endpoint | New tRPC endpoint for owners | `05-01-backend.md` |

### Phase 2: Frontend Hook Wiring

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 2A | Wire Slot Query Hook | Replace `useSlots` mock | `05-02-frontend-hooks.md` |
| 2B | Wire Mutation Hooks | Replace block/unblock/delete/create mocks | `05-02-frontend-hooks.md` |

### Phase 3: UI Polish & Integration

| ID | Module | Description | Plan File |
|----|--------|-------------|-----------|
| 3A | Slots Page Integration | Wire page to real data, polish UI | `05-03-ui-integration.md` |

---

## Dependencies

```
Phase 1 (Backend) ────► Phase 2 (Hooks) ────► Phase 3 (UI)
```

All phases are sequential - each depends on the previous.

---

## Key Implementation Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Endpoint naming | `timeSlot.getForCourt` | Distinguishes from player-facing `getAvailable` |
| Player info source | Join reservation table | HELD/BOOKED slots need player snapshot data |
| Status mapping | Backend UPPERCASE → Frontend lowercase | Maintain existing frontend conventions |

---

## Backend Requirements Summary

### NEW: `timeSlot.getForCourt`

```typescript
// Input
{
  courtId: string,
  startDate: string,  // ISO datetime
  endDate: string     // ISO datetime
}

// Output
TimeSlotWithPlayerInfo[]

interface TimeSlotWithPlayerInfo {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
  priceCents: number | null;
  currency: string | null;
  // Player info for HELD/BOOKED
  playerName?: string;
  playerPhone?: string;
}
```

---

## Frontend Changes Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/features/owner/hooks/use-slots.ts` | Replace all mocks with tRPC calls |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Fetch real court data |

### Hook Mapping

| Hook | Current | Target |
|------|---------|--------|
| `useSlots` | Mock `generateMockSlots()` | `trpc.timeSlot.getForCourt` |
| `useBlockSlot` | Mock setTimeout | `trpc.timeSlot.block` |
| `useUnblockSlot` | Mock setTimeout | `trpc.timeSlot.unblock` |
| `useDeleteSlot` | Mock setTimeout | `trpc.timeSlot.delete` |
| `useCreateBulkSlots` | Mock setTimeout | `trpc.timeSlot.createBulk` |

---

## UI/UX Considerations

Per Design System `business-contexts/kudoscourts-design-system.md`:

### Status Badges

| Status | Background | Text | Design System Ref |
|--------|------------|------|-------------------|
| Available | `#ECFDF5` (success-light) | `#059669` (success) | Section 5.4 |
| Pending (HELD) | `#FFFBEB` (warning-light) | `#D97706` (warning) | Section 5.7 |
| Booked | `#CCFBF1` (primary-light) | `#0F766E` (primary-dark) | Section 5.4 |
| Blocked | `muted` | `muted-foreground` | Section 5.7 |

### Typography

- Slot time: **Outfit 600** (heading font)
- Player info: **Source Sans 3 400** (body font)
- Price: **Outfit 700** (per design system)

### Actions

- Primary actions (Add Slots): Teal button (`#0D9488`)
- Destructive actions (Delete): Red button (`#DC2626`)
- Block/Unblock: Secondary outline button

---

## Testing Checklist

### Phase 1 (Backend)
- [ ] `getForCourt` returns all statuses
- [ ] Player info populated for HELD/BOOKED
- [ ] Ownership verification works
- [ ] Date range filtering works

### Phase 2 (Hooks)
- [ ] `useSlots` returns real data
- [ ] All mutations call correct endpoints
- [ ] Cache invalidation works
- [ ] Error handling works

### Phase 3 (UI)
- [ ] Slots display with correct badges
- [ ] Player info shows for HELD/BOOKED
- [ ] Actions work (block, unblock, delete)
- [ ] Bulk creation works
- [ ] Empty state displays correctly

---

## Document Index

| Document | Description |
|----------|-------------|
| `05-00-overview.md` | This file |
| `05-01-backend.md` | Backend implementation details |
| `05-02-frontend-hooks.md` | Frontend hook wiring |
| `05-03-ui-integration.md` | UI polish and integration |

---

## Success Criteria

- [ ] Owner can create single and bulk time slots
- [ ] Owner can view all slots for a date (all statuses)
- [ ] Owner can see player info on HELD/BOOKED slots
- [ ] Owner can block/unblock available slots
- [ ] Owner can delete available slots
- [ ] All actions use real backend data (no mocks)
- [ ] UI follows design system guidelines
